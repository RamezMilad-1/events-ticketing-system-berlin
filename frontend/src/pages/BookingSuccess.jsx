import { Link } from 'react-router-dom';
import { CheckCircle2, Ticket, Mail } from 'lucide-react';

const BookingSuccess = () => (
    <div className="bg-surface-200/40 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
            <div className="card text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle2 size={36} className="text-emerald-500" strokeWidth={2} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-navy-600 mb-2">Booking confirmed</h1>
                <p className="text-slate-600 mb-6">
                    Your tickets are saved to your account. We've sent a confirmation to your email.
                </p>

                <div className="rounded-xl bg-surface-200 p-4 text-left mb-6">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">What's next</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex gap-2"><Mail size={16} className="text-primary-500 mt-0.5 shrink-0" /> Check your inbox for a receipt and QR code.</li>
                        <li className="flex gap-2"><Ticket size={16} className="text-primary-500 mt-0.5 shrink-0" /> Show the QR at the venue entrance — that's your ticket.</li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/bookings" className="btn btn-primary flex-1">View my bookings</Link>
                    <Link to="/" className="btn btn-outline flex-1">Browse more events</Link>
                </div>
            </div>
        </div>
    </div>
);

export default BookingSuccess;
