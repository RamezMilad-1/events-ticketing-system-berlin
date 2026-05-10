import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { contactService } from '../services/api';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
    const [sending, setSending] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (sending) return;

        // Simple client-side validation up front so we don't round-trip an obviously-bad form
        if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 5) {
            toast.error('Please fill in all fields. Tell us a bit about what you need.');
            return;
        }

        setSending(true);
        try {
            const res = await contactService.submit(form);
            toast.success(res.data?.message || 'Thanks! We received your message.');
            setSubmitted(true);
            setForm({ name: '', email: '', subject: 'general', message: '' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not send message. Please try again.';
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-surface-200/40 min-h-screen pb-16">
            <div className="bg-navy-700 text-white">
                <div className="container-page py-12 sm:py-16">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Contact &amp; Support</h1>
                    <p className="max-w-2xl text-white/85">
                        Got a question about a booking, a venue, or selling tickets? Send us a message — our support team reads every one and replies within 1–2 business days.
                    </p>
                </div>
            </div>

            <section className="container-page py-10">
                <div className="grid lg:grid-cols-[1fr,360px] gap-8">
                    {/* Form */}
                    <div className="card space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-navy-600">Send us a message</h2>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-primary-500" />
                                Goes straight to the eventHub support inbox — only our admins can read it.
                            </p>
                        </div>

                        {submitted ? (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 flex gap-3 items-start">
                                <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-emerald-800">Message received.</p>
                                    <p className="text-sm text-emerald-700 mt-1">
                                        We've logged your message and our support team will reply to your email within 1–2 business days. Need to send another?
                                    </p>
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline mt-2"
                                        onClick={() => setSubmitted(false)}
                                    >
                                        Send another message
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Your name</label>
                                        <input
                                            id="contact-name"
                                            type="text"
                                            required
                                            maxLength={120}
                                            className="input"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            required
                                            maxLength={200}
                                            className="input"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="contact-subject" className="block text-sm font-semibold text-slate-700 mb-1.5">Topic</label>
                                    <select
                                        id="contact-subject"
                                        className="input"
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    >
                                        <option value="general">General enquiry</option>
                                        <option value="booking">Booking issue</option>
                                        <option value="organiser">Selling tickets / organisers</option>
                                        <option value="press">Press &amp; partnerships</option>
                                        <option value="bug">Report a bug</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-700 mb-1.5">Your message</label>
                                    <textarea
                                        id="contact-message"
                                        rows="6"
                                        required
                                        minLength={5}
                                        maxLength={4000}
                                        className="input"
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{form.message.length}/4000</p>
                                </div>

                                <button type="submit" disabled={sending} className="btn btn-primary">
                                    <Send size={16} /> {sending ? 'Sending…' : 'Send message'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Side info */}
                    <aside className="space-y-4">
                        <div className="card">
                            <h3 className="text-base font-bold text-navy-600 mb-4">Other ways to reach us</h3>
                            <div className="space-y-3 text-sm">
                                <ContactRow
                                    icon={<Mail size={15} />}
                                    label="Email"
                                    value="ramezmilad19@gmail.com"
                                    href="mailto:ramezmilad19@gmail.com"
                                />
                                <ContactRow
                                    icon={<Phone size={15} />}
                                    label="Phone"
                                    value="01200790271"
                                    href="tel:01200790271"
                                />
                                <ContactRow
                                    icon={<MessageCircle size={15} />}
                                    label="Live chat"
                                    value="Mon–Fri 10:00–18:00"
                                />
                                <ContactRow
                                    icon={<MapPin size={15} />}
                                    label="Office"
                                    value="Friedrichstraße 200, 10117 Berlin"
                                />
                            </div>
                        </div>

                        <div className="card bg-primary-50 border-primary-100">
                            <h3 className="text-base font-bold text-navy-600 mb-1">Faster: visit an outlet</h3>
                            <p className="text-sm text-slate-700">Drop by any of our box offices for in-person help and cash payments.</p>
                            <Link to="/outlets" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 mt-2">
                                See all outlets →
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
};

const ContactRow = ({ icon, label, value, href }) => (
    <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
            {icon}
        </div>
        <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{label}</p>
            {href ? (
                <a href={href} className="text-sm text-slate-900 hover:text-primary-600 font-medium transition">
                    {value}
                </a>
            ) : (
                <p className="text-sm text-slate-900 font-medium">{value}</p>
            )}
        </div>
    </div>
);

export default Contact;
