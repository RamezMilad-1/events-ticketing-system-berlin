import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { LogoMark } from './Logo';

// Inline SVG brand marks — lucide-react v1.x doesn't ship brand icons.
const InstagramIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.39C1.34 2.69.93 3.36.62 4.14.32 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.25 2.15.56 2.91.31.79.72 1.46 1.39 2.13.67.67 1.34 1.08 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.25 2.91-.56.79-.31 1.46-.72 2.13-1.39.67-.67 1.08-1.34 1.39-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.25-2.15-.56-2.91-.31-.79-.72-1.46-1.39-2.13C21.31 1.34 20.64.93 19.86.62 19.1.32 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88"/>
    </svg>
);
const FacebookIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692V11.08h3.128V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.762v2.31h3.587l-.467 3.626h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.407 0 22.675 0z"/>
    </svg>
);
const TwitterIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);
const YoutubeIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-16 border-t border-slate-200 bg-surface-200/60">
            <div className="container-page py-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2">
                            <LogoMark size={36} />
                            <span className="text-xl font-extrabold tracking-tight leading-none text-navy-600">
                                Early<span className="text-primary-500">Hub</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-xs">
                            Discover concerts, theatre, sports and nightlife in Berlin. Book in seconds, walk in with your phone.
                        </p>
                        <div className="flex gap-3 mt-5">
                            {[
                                { Icon: InstagramIcon, href: '#', label: 'Instagram' },
                                { Icon: FacebookIcon, href: '#', label: 'Facebook' },
                                { Icon: TwitterIcon, href: '#', label: 'Twitter' },
                                { Icon: YoutubeIcon, href: '#', label: 'YouTube' },
                            ].map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-primary-400 hover:text-primary-600 transition"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Browse */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-4">Browse</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link to="/" className="text-slate-600 hover:text-primary-600 transition">All events</Link></li>
                            <li><Link to="/outlets" className="text-slate-600 hover:text-primary-600 transition">Outlets</Link></li>
                            <li><Link to="/?category=concert" className="text-slate-600 hover:text-primary-600 transition">Concerts</Link></li>
                            <li><Link to="/?category=theater" className="text-slate-600 hover:text-primary-600 transition">Theatre</Link></li>
                            <li><Link to="/?category=sports" className="text-slate-600 hover:text-primary-600 transition">Sports</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link to="/about" className="text-slate-600 hover:text-primary-600 transition">About us</Link></li>
                            <li><Link to="/contact" className="text-slate-600 hover:text-primary-600 transition">Contact &amp; Support</Link></li>
                            <li><a href="#" className="text-slate-600 hover:text-primary-600 transition">Careers</a></li>
                            <li><a href="#" className="text-slate-600 hover:text-primary-600 transition">For organisers</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-4">Contact</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li className="flex items-start gap-2 text-slate-600">
                                <Mail size={15} className="mt-0.5 text-slate-400 shrink-0" />
                                <a href="mailto:hello@earlyhub.com" className="hover:text-primary-600 transition break-all">hello@earlyhub.com</a>
                            </li>
                            <li className="flex items-start gap-2 text-slate-600">
                                <Phone size={15} className="mt-0.5 text-slate-400 shrink-0" />
                                <a href="tel:+493012345678" className="hover:text-primary-600 transition">+49 30 1234 5678</a>
                            </li>
                            <li className="flex items-start gap-2 text-slate-600">
                                <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
                                <span>Friedrichstraße 200<br />10117 Berlin</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom strip */}
            <div className="border-t border-slate-200 bg-white">
                <div className="container-page py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-slate-500">
                        &copy; {currentYear} EarlyHub. All rights reserved.
                    </p>
                    <div className="flex gap-5 text-xs text-slate-500">
                        <a href="#" className="hover:text-primary-600 transition">Privacy</a>
                        <a href="#" className="hover:text-primary-600 transition">Terms</a>
                        <a href="#" className="hover:text-primary-600 transition">Cookies</a>
                        <a href="#" className="hover:text-primary-600 transition">Imprint</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
