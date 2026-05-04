require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRouter = require('./Routes/auth');
const userRouter = require('./Routes/user');
const eventRouter = require('./Routes/eventroute');
const bookingRouter = require('./Routes/bookingroute');
const outletRouter = require('./Routes/outletroute');

const authenticationMiddleware = require('./Middleware/authenticationMiddleware');
const { optional: optionalAuthenticationMiddleware } = require('./Middleware/authenticationMiddleware');
const errorHandler = require('./Middleware/errorHandler');

const app = express();

// --- Middleware ---
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

// --- Health check ---
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Routes ---
// Public auth (login/register/logout/forgetPassword)
app.use('/api/v1', authRouter);

// Authenticated user routes
app.use('/api/v1/users', authenticationMiddleware, userRouter);

// Events: public read, but pass req.user when token is present so controllers can gate admin actions
app.use('/api/v1/events', optionalAuthenticationMiddleware, eventRouter);

// Bookings: must be authenticated
app.use('/api/v1/bookings', authenticationMiddleware, bookingRouter);

// Outlets (box-office locations): public read, admin write
app.use('/api/v1/outlets', optionalAuthenticationMiddleware, outletRouter);

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
    console.warn('[warn] JWT_SECRET is not set in .env — using an unsafe fallback. Configure JWT_SECRET in production.');
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

app.listen(PORT, () => console.log(`[server] running on port ${PORT}`));
