import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Receipt, Search, ArrowUpRight, Clock, History, Ticket, Sparkles
} from 'lucide-react';
import { bookingService } from '../services/api';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=900&q=80';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatDateTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await bookingService.getMyBookings();
        if (data?.success) {
          setBookings(data.bookings || []);
        } else {
          setError(data?.message || 'Unable to load bookings');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((booking) => {
        const eventDate = booking.event?.date ? new Date(booking.event.date) : null;
        const isUpcoming = eventDate ? eventDate >= now : false;
        if (filter === 'upcoming') return isUpcoming && booking.status !== 'canceled';
        if (filter === 'cancelled') return booking.status === 'canceled';
        if (filter === 'all') return true;
        return true;
      })
      .sort((a, b) => new Date(a.event?.date) - new Date(b.event?.date));
  }, [bookings, filter]);

  const stats = useMemo(() => ({
    total: bookings.reduce((sum, booking) => booking.status === 'canceled' ? sum : sum + (booking.totalPrice || 0), 0),
    tickets: bookings.reduce((sum, booking) => {
      if (booking.status === 'canceled') return sum;
      return sum + (booking.ticketBookings?.reduce((ticketSum, ticket) => ticketSum + (ticket.quantity || 0), 0) || booking.numberOfTickets || 0);
    }, 0),
    upcoming: bookings.filter((booking) => booking.status !== 'canceled' && booking.event?.date && new Date(booking.event.date) >= new Date()).length,
  }), [bookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingService.cancelBooking(bookingId);
      setBookings((current) => current.map((booking) => booking._id === bookingId ? { ...booking, status: 'canceled' } : booking));
    } catch (cancelError) {
      console.error(cancelError);
      alert('Unable to cancel booking. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-slate-50">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white text-slate-900 selection:bg-blue-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)] sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-200 ring-1 ring-white/10">
                <Ticket size={18} /> Live booking studio
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-extrabold tracking-tight text-white">Your bookings.</h1>
                <p className="max-w-lg text-slate-300 leading-7">Easily view your upcoming events, access ticket details, and download or present your tickets for entry</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Upcoming shows" value={stats.upcoming} icon={<Clock size={18} />} />
              <StatCard label="Booked tickets" value={stats.tickets} icon={<Sparkles size={18} />} />
              <StatCard label="Total spent" value={formatCurrency(stats.total)} icon={<Receipt size={18} />} />
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Filter by</p>
            <h2 className="text-3xl font-semibold text-slate-900">Booking history</h2>
          </div>

          <div className="inline-flex rounded-3xl bg-white/80 p-1 shadow-sm ring-1 ring-slate-200">
            {[
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${filter === tab.id ? 'bg-slate-950 text-white shadow-lg shadow-slate-200/20' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-3xl border border-rose-100 bg-rose-50 px-6 py-5 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5">
          {filteredBookings.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-14 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">No bookings match this view yet.</p>
              <p className="mt-2 text-slate-500">Switch filters or book your next concert to see it here.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} onCancel={handleCancel} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(255,255,255,0.45)]">
    <div className="flex items-center gap-3 text-cyan-200">{icon}</div>
    <p className="mt-4 text-sm uppercase tracking-[0.25em] text-slate-300">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);

const BookingCard = ({ booking, onCancel }) => {
  const { event = {}, status, totalPrice, ticketBookings = [], selectedSeats = [] } = booking;
  const dateTime = formatDateTime(event.date);
  const isUpcoming = event.date ? new Date(event.date) >= new Date() : false;
  const ticketCount = ticketBookings.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || booking.numberOfTickets || 0;

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/95 shadow-[0_18px_50px_-25px_rgba(15,23,42,0.12)] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-28px_rgba(15,23,42,0.14)]">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="relative h-64 overflow-hidden rounded-[1.5rem] bg-slate-950">
          <img
            src={event.image || DEFAULT_IMAGE}
            alt={event.title || 'Event image'}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300">{event.category ? event.category.toUpperCase() : 'CONCERT'}</p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">{event.title || 'Untitled event'}</h3>
          </div>
        </div>

        <div className="flex flex-col justify-between p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                status === 'pending' ? 'bg-yellow-50 text-amber-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {status || 'Confirmed'}
              </span>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{isUpcoming ? 'Upcoming show' : 'Finished show'}</span>
            </div>

            <p className="line-clamp-3 text-sm leading-6 text-slate-600">{event.description || 'No description available for this event.'}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoTile icon={<MapPin size={18} />} label="Location" value={event.location || 'TBA'} />
              <InfoTile icon={<Clock size={18} />} label="Date & time" value={dateTime || 'TBA'} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoTile icon={<Ticket size={18} />} label="Tickets" value={`${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`} />
              <InfoTile icon={<Receipt size={18} />} label="Paid" value={formatCurrency(totalPrice)} />
            </div>

            {selectedSeats.length > 0 && (
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Seats</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedSeats.join(', ')}</p>
              </div>
            )}

            {ticketBookings.length > 0 && (
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ticket breakdown</p>
                <div className="mt-3 space-y-2">
                  {ticketBookings.map((ticket) => (
                    <div key={ticket.ticketType} className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{ticket.ticketType}</span>
                      <span className="text-slate-500">{ticket.quantity} × {formatCurrency(ticket.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/events/${event._id}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowUpRight size={16} /> View event details
            </Link>
            {status !== 'canceled' && (
              <button
                onClick={() => onCancel(booking._id)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200/40 transition hover:brightness-110"
              >
                Cancel booking
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const InfoTile = ({ icon, label, value }) => (
  <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-3 shadow-sm">
    <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[11px] uppercase tracking-[0.24em]">{label}</span></div>
    <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

export default MyBookings;
