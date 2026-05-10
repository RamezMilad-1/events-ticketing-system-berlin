require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRouter = require('./Routes/auth');
const userRouter = require('./Routes/user');
const eventRouter = require('./Routes/eventroute');
const bookingRouter = require('./Routes/bookingroute');
const outletRouter = require('./Routes/outletroute');
const contactRouter = require('./Routes/contactroute');

const authenticationMiddleware = require('./Middleware/authenticationMiddleware');
const { optional: optionalAuthenticationMiddleware } = require('./Middleware/authenticationMiddleware');
const errorHandler = require('./Middleware/errorHandler');

const app = express();

// Trust the first proxy (e.g. nginx/render/heroku) so secure cookies + rate-limit IPs work in prod.
app.set('trust proxy', 1);

// --- Middleware ---
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' })); // larger limit for base64 image uploads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: corsOrigins,
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
        credentials: true,
    })
);

// Rate-limit ONLY the brute-forceable auth endpoints (login, register, password reset).
// Generous enough that legitimate users won't notice; tight enough to stop scripts.
// IMPORTANT: scoped to specific paths below — must NOT wrap the whole /api/v1 prefix
// or normal browsing (events list, profile, bookings) gets throttled too.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
});

// --- Health check ---
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Routes ---
// Apply the auth rate-limiter ONLY to the brute-forceable endpoints.
// Logout is intentionally not limited (legitimate users should always be able to sign out).
app.use(
    [
        '/api/v1/login',
        '/api/v1/register',
        '/api/v1/forgetPassword',
        '/api/v1/forgotPassword',
    ],
    authLimiter
);

// Public auth router (login/register/logout/forgetPassword/forgotPassword)
app.use('/api/v1', authRouter);

// Authenticated user routes
app.use('/api/v1/users', authenticationMiddleware, userRouter);

// Events: public read, but pass req.user when token is present so controllers can gate admin actions
app.use('/api/v1/events', optionalAuthenticationMiddleware, eventRouter);

// Bookings: must be authenticated
app.use('/api/v1/bookings', authenticationMiddleware, bookingRouter);

// Outlets (box-office locations): public read, admin write
app.use('/api/v1/outlets', optionalAuthenticationMiddleware, outletRouter);

// Contact messages: public POST, admin GET/PATCH/DELETE
app.use('/api/v1/contact', contactRouter);

// --- 404 fallback for API ---
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
    }
    next();
});

// --- Centralized error handler ---
app.use(errorHandler);

// --- Database & server boot ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/EventBooking';

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('[fatal] JWT_SECRET must be set in production. Refusing to start.');
        process.exit(1);
    }
    console.warn('[warn] JWT_SECRET is not set in .env — using an unsafe fallback. Configure JWT_SECRET before deploying.');
}

// Fail fast instead of buffering queries when Mongo is unreachable.
// Without this, requests just hang for 10s before erroring with "buffering timed out".
mongoose.set('bufferTimeoutMS', 5000);
mongoose.set('strictQuery', true);

function connectDb(attempt = 1) {
    return mongoose
        .connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        .then(() => {
            console.log(`[db] connected to ${MONGO_URI.replace(/:[^:@]*@/, ':***@')}`);
            return backfillTheaterSeating();
        })
        .catch((e) => {
            console.error('\n[db] connection failed:', e.message);
            console.error('     Hint: make sure MongoDB is running locally, or update MONGO_URI in backend/.env.');
            console.error(`     Attempt ${attempt} — retrying in 5s...\n`);
            if (attempt < 5) {
                setTimeout(() => connectDb(attempt + 1), 5000);
            } else {
                console.error('[db] giving up after 5 attempts. API requests will fail until Mongo is reachable.\n');
            }
        });
}

mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
});

// One-shot migration: theater events created before the seating layout requirement
// get their seating_rows / seating_columns auto-populated based on their total tickets
// so the seat picker renders properly.
async function backfillTheaterSeating() {
    try {
        const Event = require('./Model/EventSchema');
        const events = await Event.find({ category: 'theater' });
        let updated = 0;
        for (const ev of events) {
            const cf = ev.custom_fields || {};
            const hasRows = Number(cf.seating_rows) > 0;
            const hasCols = Number(cf.seating_columns) > 0;
            if (hasRows && hasCols) continue;

            const total =
                (Array.isArray(ev.ticketTypes) && ev.ticketTypes.length > 0
                    ? ev.ticketTypes.reduce((s, t) => s + (t.quantity || 0), 0)
                    : ev.totalTickets || 0) || 200;
            const cols = Math.max(6, Math.ceil(Math.sqrt(total * 1.4)));
            const rows = Math.max(3, Math.ceil(total / cols));

            ev.custom_fields = { ...cf, seating_rows: cf.seating_rows || rows, seating_columns: cf.seating_columns || cols };
            ev.markModified('custom_fields');
            await ev.save();
            updated++;
        }
        if (updated > 0) {
            console.log(`[db] backfilled seating layout for ${updated} theater event(s)`);
        }
    } catch (e) {
        console.warn('[db] backfill skipped:', e.message);
    }
}

connectDb();

const server = app.listen(PORT, () => console.log(`[server] running on port ${PORT}`));

// Crash on truly unrecoverable errors so the process manager (pm2/systemd/render) can restart cleanly.
process.on('unhandledRejection', (reason) => {
    console.error('[fatal] Unhandled promise rejection:', reason);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('[fatal] Uncaught exception:', err);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('[server] SIGTERM received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false).finally(() => process.exit(0));
    });
});
