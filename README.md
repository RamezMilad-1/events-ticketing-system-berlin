# eventHub — Berlin Events Ticketing Platform

> Production-deployed full-stack MERN application for discovering and booking events in Berlin. Three role-based dashboards, multi-tier ticketing, atomic theatre-seat allocation, OTP password reset, and organiser analytics.

**[Live demo](https://events-ticketing-system-berlin-3.onrender.com)** · **[Test credentials](#test-credentials)** · **[Tech stack](#tech-stack)** · **[Architecture highlights](#architecture-highlights)**

---

## Highlights

- **Production deployed** on Render (web service + static site) with MongoDB Atlas. Live URL above.
- **Cross-origin JWT auth** — Authorization Bearer token primary, httpOnly cookie fallback. Survives third-party cookie blocking in Safari and Chrome.
- **Three role-based dashboards** with route-level RBAC: Standard User, Organiser, System Admin.
- **Atomic seat allocation** for theatre events — two simultaneous bookings can't grab the same seat; the second request is rejected at the database layer.
- **Multi-tier ticket inventory** — each tier (VIP, Standard, Early Bird, etc.) tracks its own price and remaining count; bookings update counts in a single DB operation to prevent over-selling.
- **OTP password reset** — 6-digit codes, SHA-256-hashed at rest, 10-minute TTL, 5-attempt lockout, delivered via Gmail SMTP in production.
- **Hardened auth surface** — bcrypt (10 rounds), Helmet, CORS allowlist, rate-limited login/register/reset (50 req per 15 min), JWT secret required in production (fail-fast on boot).
- **Organiser analytics** with Recharts — per-event "% booked" bar chart, sold-vs-remaining donut, aggregate KPIs.
- **Resilient infrastructure** — Mongoose retry loop on boot, graceful SIGTERM shutdown, fail-fast on unhandled rejections, trust-proxy enabled for Render's edge.
- **Client-side image compression** for profile pictures and event posters — no oversized payloads hitting the server.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router 6, Axios, Recharts, Chart.js, react-toastify, Lucide |
| **Backend** | Node.js, Express 4, REST API |
| **Database** | MongoDB, Mongoose 7 (local + Atlas) |
| **Auth & security** | JWT (Bearer + httpOnly cookie), bcrypt, Helmet, express-rate-limit, cookie-parser |
| **Email** | Nodemailer + Gmail SMTP (dev fallback: console log) |
| **Deployment** | Render (web service + static site), MongoDB Atlas |
| **Tooling** | ESLint, Nodemon, dotenv, Git, GitHub |

---

## Test Credentials

Sign in to the [live demo](https://events-ticketing-system-berlin-3.onrender.com) with either account — both exist on the production database.

```
System Admin    admin@eventhub.com        Admin@2026
Organizer       organizer@eventhub.com    Organizer@2026
```

Register a Standard User from the sign-up form to evaluate the visitor experience.

---

## Screenshots

### Discover

<img src="docs/screenshots/home-discover.png" alt="Home page with hot events, categories, and venue grid" width="640" />

### Event details · Theatre seat picker

<table>
  <tr>
    <td><img src="docs/screenshots/event-details.png" alt="Event details page with ticket tier panel" width="320" /></td>
    <td><img src="docs/screenshots/theater-seat-picker.png" alt="Interactive theatre seat picker grid" width="320" /></td>
  </tr>
</table>

### Multi-tier checkout · Auth flow

<table>
  <tr>
    <td><img src="docs/screenshots/booking-multitier.png" alt="Multi-tier ticket selector" width="320" /></td>
    <td><img src="docs/screenshots/login.png" alt="Login page" width="320" /></td>
  </tr>
</table>

### Organiser analytics · Organiser's events

<table>
  <tr>
    <td><img src="docs/screenshots/organizer-analytics.png" alt="Organiser analytics dashboard with bar and donut charts" width="320" /></td>
    <td><img src="docs/screenshots/organizer-my-events.png" alt="Organiser my-events list" width="320" /></td>
  </tr>
</table>

### Admin event queue · Admin user management

<table>
  <tr>
    <td><img src="docs/screenshots/admin-events.png" alt="Admin event queue with approve/decline actions" width="320" /></td>
    <td><img src="docs/screenshots/admin-users.png" alt="Admin user management with role updates" width="320" /></td>
  </tr>
</table>

---

## Architecture Highlights

These are the engineering decisions worth zooming in on.

**Cross-origin authentication.** Render hosts frontend and backend on different `*.onrender.com` subdomains. Because `onrender.com` is on the Public Suffix List, browsers classify them as cross-site, and Safari + Chrome's third-party cookie blocking silently drops the JWT cookie. Solution: the backend also returns the token in the login response body; the client stores it in `localStorage` and attaches it as `Authorization: Bearer …` on every request. The cookie path is retained as a fallback. Works in every browser regardless of cookie policy.

**Concurrent seat-conflict prevention.** Theatre events render a seat grid. When two users click "Confirm" on the same seat at the same time, only the first commit succeeds — the server re-checks taken seats inside the booking transaction and rejects the loser with a clear error. No optimistic UI lies.

**Per-tier inventory in one write.** Multi-tier events store an array of ticket types each with `{ price, quantity, remaining }`. A booking decrements `remaining` for each requested tier in a single `findOneAndUpdate` so concurrent bookings can't oversell.

**Privacy-preserving password reset.** The `/forgetPassword/request` endpoint returns 200 whether or not the email is registered, preventing user enumeration. OTPs are hashed (SHA-256) before storage; attempts are capped at 5; tokens expire after 10 minutes.

**Production resilience.** Mongoose connects with a retry loop (5 attempts, exponential delay). `unhandledRejection` and `uncaughtException` trigger a graceful shutdown so the process manager can restart cleanly. `app.set('trust proxy', 1)` makes secure cookies + rate-limit IP detection work behind Render's edge.

---

## Features by Role

**Visitor**

- Browse approved events with debounced search across title, description, and location
- Filter by category, venue, or date range (URL-driven so links are shareable)
- Hot Events carousel ranks the top 5 events by tickets sold
- Per-tier availability with "Sold out" / "Only N left" indicators
- Wishlist support

**Organiser**

- Create events with category-specific custom fields (concert lineup, sports teams, conference speakers, etc.)
- Multi-tier pricing with auto-calculated theatre seating geometry
- Analytics dashboard: KPIs (events, total tickets, sold, revenue), per-event "% booked" bar chart, sold-vs-available donut

**System Admin**

- Approve / decline / delete any event with status filters
- Manage users — search, change roles, delete accounts (current admin row locked against self-demotion)
- Manage outlets (physical ticket pickup points) and triage contact-form messages

---

## Local Setup

**Prerequisites:** Node.js 18+, MongoDB running locally (or an Atlas connection string).

### Backend

```bash
cd backend
cp .env.example .env
npm install
node scripts/seed-test-data.js   # creates the admin account + sample data
npm run dev                      # http://localhost:3000
```

Health check: `GET http://localhost:3000/api/v1/health`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                      # http://localhost:5173
```

### Forgot-password locally

By default `EMAIL_HOST` is empty, so the backend logs the OTP to the terminal:

```
========================================
[email:dev] OTP for admin@eventhub.com: 123456 (valid 10 min)
========================================
```

Copy the code into the OTP step. To send real emails locally, fill in the Gmail SMTP vars in `backend/.env`.

---

## API Reference

<details>
<summary>Full route list (click to expand)</summary>

All routes are mounted under `/api/v1`.

#### Auth (public)

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate, returns JWT in body and cookie |
| POST | `/logout` | Clear JWT cookie |
| POST | `/forgetPassword/request` | Request OTP for password reset |
| POST | `/forgetPassword/verify` | Verify OTP, returns reset token |
| PUT  | `/forgetPassword` | Reset password (single-call or reset-token) |

#### Users

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| GET | `/users/profile` | Auth | Current profile |
| PUT | `/users/profile` | Auth | Update profile |
| DELETE | `/users/profile` | Auth | Self-delete |
| PUT | `/users/changePassword` | Auth | Change own password |
| GET | `/users/:id` | Admin | Single user |
| PUT | `/users/:id` | Admin | Update role |
| DELETE | `/users/:id` | Admin | Delete user |
| GET | `/users/bookings` | Standard User | Own bookings |
| GET | `/users/events` | Organiser | Own events |
| GET | `/users/events/analytics` | Organiser | Per-event analytics |

#### Events

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/events` | Public | List approved events |
| GET | `/events/all` | Admin | List all events (any status) |
| GET | `/events/:id` | Public | Single event |
| POST | `/events` | Organiser | Create event (defaults to `pending`) |
| PUT | `/events/:id` | Organiser / Admin | Update event |
| DELETE | `/events/:id` | Organiser / Admin | Delete event |
| PUT | `/events/:id/status` | Admin | Update status |

#### Bookings

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/bookings` | Standard User | Create booking |
| GET | `/bookings/:id` | Standard User | Own booking detail |
| DELETE | `/bookings/:id` | Standard User | Cancel booking |
| GET | `/bookings/event/:eventId` | Auth | Booked seats for an event (theatre seat picker) |

#### Outlets

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/outlets` | Public | List active outlets |
| POST | `/outlets` | Admin | Create outlet |
| PUT | `/outlets/:id` | Admin | Update outlet |
| DELETE | `/outlets/:id` | Admin | Remove outlet |

</details>

---

## Deployment

<details>
<summary>Render + MongoDB Atlas (click to expand the 9-step guide)</summary>

1. **Render Web Service (backend)**
   - Repo: this repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Backend environment variables**

   ```
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/EventBooking?...
   JWT_SECRET=<long random string>
   CORS_ORIGINS=https://<your-frontend>.onrender.com
   OTP_TTL_MINUTES=10
   OTP_MAX_ATTEMPTS=5

   # Gmail SMTP for password-reset emails
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_USER=<your-gmail@gmail.com>
   EMAIL_PASS=<16-char Gmail App Password>
   EMAIL_FROM=eventHub <your-gmail@gmail.com>
   ```

   Gmail App Password: enable 2-Step Verification on the Google account, then *Security → App passwords → Create*. Use the 16-character code in `EMAIL_PASS`, not your account password.

3. **MongoDB Atlas free cluster**
   - Create a database user.
   - Allow network access from `0.0.0.0/0` (Render's egress IPs aren't fixed on the free tier).
   - The URI must include `/EventBooking` after `.mongodb.net`.

4. **Migrate local data to Atlas**

   ```bash
   mongodump --uri="mongodb://localhost:27017/EventBooking" --out="$HOME/Desktop/mongo-backup"
   mongorestore --uri="mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/EventBooking?..." "$HOME/Desktop/mongo-backup/EventBooking"
   ```

5. **Render Static Site (frontend)**
   - Same repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

6. **Frontend environment variable**

   ```
   VITE_API_BASE_URL=https://<your-backend>.onrender.com/api/v1
   ```

7. **Production cookie config** (already applied in this repo)

   ```js
   const COOKIE_OPTIONS = () => ({
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
       path: '/',
   });
   ```

8. **Commit and push** — Render auto-deploys.

9. **Manual redeploy** (if auto-deploy is off): Render dashboard → service → *Manual Deploy → Deploy latest commit*.

</details>

---

## Project Structure

```
events-ticketing-system-berlin/
├── backend/
│   ├── Controller/     bookingController, eventcontroller, userController, outletController, contactController
│   ├── Middleware/     authentication (Bearer + cookie), authorization, errorHandler
│   ├── Model/          UserSchema, EventSchema, BookingSchema, OutletSchema, ContactMessageSchema
│   ├── Routes/         auth, user, eventroute, bookingroute, outletroute, contactroute
│   ├── utils/          email (nodemailer), categoryFields
│   ├── scripts/        seed-test-data.js
│   └── app.js
├── frontend/
│   └── src/
│       ├── auth/           AuthContext, ProtectedRoutes
│       ├── components/     EventCard, EventList, HotEventsCarousel, CategoryTiles, VenueGrid, TheaterSeating, TicketSelectionPanel, ...
│       ├── pages/          Home, EventDetails, Booking, MyBookings, MyEvents, EventAnalytics, Admin*, ...
│       └── services/api.js
├── docs/screenshots/
└── README.md
```

---

## Contact

- **GitHub** — [@RamezMilad-1](https://github.com/RamezMilad-1)
- **LinkedIn** — [ramez-milad-76837a282](https://www.linkedin.com/in/ramez-milad-76837a282)
- **Email** — ramezmilad19@gmail.com
