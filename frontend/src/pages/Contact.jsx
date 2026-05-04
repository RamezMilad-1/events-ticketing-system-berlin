import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSending(true);
        // No backend endpoint for contact yet — open a mailto draft so the message still gets sent.
        const subject = encodeURIComponent(`[${form.subject}] ${form.name}`);
        const body = encodeURIComponent(`From: ${form.name} <${form.email}>\n\n${form.message}`);
        window.location.href = `mailto:hello@earlyhub.com?subject=${subject}&body=${body}`;
        setTimeout(() => {
            toast.success('Opening your email app…');
            setSending(false);
        }, 400);
    };

    return (
        <div className="bg-surface-200/40 min-h-screen pb-16">
            <div className="bg-navy-700 text-white">
                <div className="container-page py-12 sm:py-16">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Contact &amp; Support</h1>
                    <p className="max-w-2xl text-white/85">
                        Got a question about a booking, a venue, or selling tickets? We're here to help — usually within a few hours.
                    </p>
                </div>
            </div>

            <section className="container-page py-10">
                <div className="grid lg:grid-cols-[1fr,360px] gap-8">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="card space-y-4">
                        <h2 className="text-xl font-bold text-navy-600">Send us a message</h2>

                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Your name</label>
                                <input
                                    id="contact-name"
                                    type="text"
                                    required
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
                                className="input"
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                            />
                        </div>

                        <button type="submit" disabled={sending} className="btn btn-primary">
                            <Send size={16} /> {sending ? 'Opening…' : 'Send message'}
                        </button>
                    </form>

                    {/* Side info */}
                    <aside className="space-y-4">
                        <div className="card">
                            <h3 className="text-base font-bold text-navy-600 mb-4">Other ways to reach us</h3>
                            <div className="space-y-3 text-sm">
                                <ContactRow
                                    icon={<Mail size={15} />}
                                    label="Email"
                                    value="hello@earlyhub.com"
                                    href="mailto:hello@earlyhub.com"
                                />
                                <ContactRow
                                    icon={<Phone size={15} />}
                                    label="Phone"
                                    value="+49 30 1234 5678"
                                    href="tel:+493012345678"
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
                            <a href="/outlets" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 mt-2">
                                See all outlets →
                            </a>
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
