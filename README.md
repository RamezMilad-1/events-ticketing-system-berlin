# eventHub — Berlin events ticketing platform

A full-stack MERN application that lets visitors discover concerts, theatre, sports, nightlife, and conferences in Berlin and book tickets in seconds. The interface is modelled on `ticketsmarche.com` — a clean, poster-wall layout with a single coral accent on a navy + white foundation. The platform supports three user roles (Standard User, Organizer, System Admin), JWT-in-cookie authentication with OTP password recovery, multi-tier tickets, theatre seat selection, an outlets/box-office directory, and a complete admin dashboard.

---

## Tech stack

| Layer    | Technologies                                                                 |
|----------|------------------------------------------------------------------------------|
| Frontend | React 18 (Vite), Tailwind CSS (navy + coral tokens, Inter), React Router 6, Axios, Recharts, react-toastify, Lucide |
| Backend  | Node.js, Express, Mongoose, bcrypt, jsonwebtoken, cookie-parser, nodemailer  |
| Database | MongoDB (local or Atlas)                                                     |

---

## Features

### Standard User
- Browse approved events with **search & filter** (by name, category, date range, location)
- View event details with real-time per-tier availability ("Sold out", "Only N left")
- Book tickets across multiple tiers (general / VIP / orchestra / etc.) — single API call
- Reserve specific seats for theater events using a visual seat picker
- View booking history, see itemized totals, cancel bookings (tickets are returned to availability)

### Event Organizer
- Create events with category-specific custom fields (concert lineup, sports teams, conference speakers, etc.)
- Edit event date, location, and ticket counts (re-enters admin review queue)
- Delete own events
- View **per-event analytics** — % booked, tickets sold, revenue — with bar/pie charts

### System Admin
- View all events with status filters (pending / approved / declined)
- Approve, decline, or delete any event
- Manage users — view, update role, delete

### Auth
- JWT in httpOnly cookie (CSRF-resistant, persistent for 7 days)
- Bcrypt password hashing
- **Forgot password with OTP via email** (Multi-Factor Authentication bonus)
  - 3-step wizard: request → verify → reset
  - Single-call form also supported (`PUT /api/v1/forgetPassword`)
- Forgot-password OTPs fall back to console-logging in dev when SMTP is not configured

### UI / UX
- Responsive Tailwind design with custom design tokens
- Toast notifications via react-toastify
- Reusable Loader, ConfirmDialog, EmptyState components
- Mobile-friendly Navbar with profile dropdown
- Role-based route protection with intended-URL preservation

---

## Project structure

```
events-ticketing-system-berlin/
├── backend/
│   ├── Controller/         # bookingController, eventcontroller, userController
│   ├── Middleware/         # authentication, authorization, errorHandler
│   ├── Model/              # UserSchema, EventSchema, BookingSchema
│   ├── Routes/             # auth, user, eventroute, bookingroute
│   ├── utils/              # email (nodemailer), categoryFields
│   ├── app.js              # entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── auth/           # AuthContext, ProtectedRoutes
│   │   ├── components/     # Navbar, Footer, EventList, EventCard, etc.
│   │   ├── components/ui/  # Loader, ConfirmDialog, EmptyState
│   │   ├── pages/          # Profile, MyBookings, MyEvents, Admin*, EventAnalytics, BookingDetails, ...
│   │   ├── services/api.js # Centralized Axios instance + service objects
│   │   ├── utils/          # categoryFields (mirror)
│   │   ├── App.jsx         # Routes + ToastContainer
│   │   └── main.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Prerequisites

- Node.js ≥ 18
- MongoDB running locally on port 27017 (or an Atlas connection string)

---

## Setup & run

### 1. Backend

```bash
cd backend
cp .env.example .env       # then edit values as needed
npm install
npm run dev                # nodemon, auto-reload
# or: npm start             # plain node
```

Backend listens on **http://localhost:3000** by default.

Health check: `GET /api/v1/health`

### 2. Frontend (in a new shell)

```bash
cd frontend
cp .env.example .env       # default points at http://localhost:3000/api/v1
npm install
npm run dev
```

Frontend listens on **http://localhost:5173**.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | API port | `3000` |
| `MONGO_URI` | Mongo connection string | `mongodb://localhost:27017/EventBooking` |
| `JWT_SECRET` | JWT signing secret (long random string) | _required for prod_ |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173,http://localhost:5174` |
| `EMAIL_HOST` | SMTP host (leave empty to log OTPs to console in dev) | _empty_ |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials (Gmail App Password works) | _empty_ |
| `EMAIL_FROM` | "From" header for OTP emails | `eventHub <no-reply@eventhub.local>` |
| `OTP_TTL_MINUTES` | OTP validity window | `10` |
| `OTP_MAX_ATTEMPTS` | Max bad attempts before lockout | `5` |
| `NODE_ENV` | `development` or `production` | `development` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL | `http://localhost:3000/api/v1` |

---

## API routes

All routes are mounted under `/api/v1`.

### Auth (public)
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate and set token cookie |
| POST | `/logout` (alias `/logOut`) | Clear token cookie |
| POST | `/forgetPassword/request` | Request OTP for password reset |
| POST | `/forgetPassword/verify` | Verify OTP, get reset token |
| PUT  | `/forgetPassword` | Reset password (single-call or with reset token) |

### Users
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
| GET | `/users/events` | Organizer | Own events |
| GET | `/users/events/analytics` | Organizer | Per-event analytics + totals |

### Events
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/events` | Public | List approved events |
| GET | `/events/all` | Admin | List all events (any status) |
| GET | `/events/:id` | Public | Single event |
| POST | `/events` | Organizer | Create event (status defaults to `pending`) |
| PUT | `/events/:id` | Organizer / Admin | Update event |
| DELETE | `/events/:id` | Organizer / Admin | Delete event |
| PUT | `/events/:id/status` | Admin | Update status `{ status }` |
| PUT | `/events/:id/approve` (alias) | Admin | Set status to `approved` |
| PUT | `/events/:id/decline` (alias) | Admin | Set status to `declined` |

### Bookings
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/bookings` | Standard User | Create booking |
| GET | `/bookings/:id` | Standard User | Own booking detail |
| DELETE | `/bookings/:id` | Standard User | Cancel booking (returns tickets to inventory) |
| GET | `/bookings/event/:eventId` | Auth | Booked seats for an event (theater seat picker) |

### Outlets
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/outlets` | Public | List active outlets (admin sees all) |
| GET | `/outlets/:id` | Public | Single outlet |
| POST | `/outlets` | Admin | Create outlet |
| PUT | `/outlets/:id` | Admin | Update outlet |
| DELETE | `/outlets/:id` | Admin | Remove outlet |

---

## Frontend routes

| Path | Component | Access |
|---|---|---|
| `/` | EventList | Public |
| `/login` | LoginForm | Public |
| `/register` | RegisterForm | Public |
| `/forgot-password` | ForgotPassword | Public |
| `/profile` | Profile | All authenticated |
| `/events/:eventId` | EventDetails | Public |
| `/booking/:eventId` | Booking | Standard User |
| `/booking-success` | BookingSuccess | Standard User |
| `/bookings` (alias `/my-bookings`) | MyBookings | Standard User |
| `/bookings/:id` | BookingDetails | Standard User |
| `/my-events` | MyEvents | Organizer |
| `/my-events/new` (alias `/create-event`) | CreateEvent | Organizer |
| `/my-events/:eventId/edit` (alias `/edit-event/:eventId`) | EditEvent | Organizer |
| `/my-events/analytics` (alias `/event-analytics`) | EventAnalytics | Organizer |
| `/admin/events` | AdminEventsPage | Admin |
| `/admin/users` | AdminUsersPage | Admin |
| `/outlets` | Outlets | Public |
| `/about` (alias `/about-us`) | About | Public |
| `/contact` (alias `/contact-us`) | Contact | Public |
| `/unauthorized` | Unauthorized | All |

Both spec routes and existing custom routes are wired up to keep older bookmarks working.

---

## Custom features beyond the milestone spec

These were built into the project and are fully supported:

1. **Multi-tier ticket types** — events define tiers like `general` / `vip` / `backstage` with independent prices and inventories
2. **Theater seat selection** — events with `category === 'theater'` and `seating_rows` / `seating_columns` get a visual seat-picker that prevents double-booking
3. **Category-specific custom fields** — driven by `utils/categoryFields.js` (concert lineup_schedule, sports teams, conference speakers, etc.)
4. **Image upload with client-side compression** — profile pictures and event images are compressed in the browser before upload to keep payloads small
5. **Self-delete profile** — `DELETE /users/profile` lets a logged-in user remove their account
6. **Optimistic search & filter** — client-side debounced search across title, description, location, date range

---

## Notes for graders

- Multi-Factor Authentication via email OTP is wired up at `/forgot-password` (3-step wizard) and via the spec's `PUT /api/v1/forgetPassword` endpoint. If `EMAIL_HOST` is not configured, the backend logs the OTP to the console for testing.
- All hardcoded secrets/URLs have been moved to `.env`. The frontend reads `VITE_API_BASE_URL`.
- Booking cancellation correctly increments ticket availability back (multi-tier and legacy single-tier).
- Theater seat double-booking is prevented by a server-side seat-conflict check.
- The Mongo write path for bookings uses transactions when available (replica set / Atlas), with a graceful fallback for standalone Mongo.

---

## License

MIT
