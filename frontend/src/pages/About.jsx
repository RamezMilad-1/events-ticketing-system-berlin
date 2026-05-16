import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShieldCheck, Headphones } from 'lucide-react';

const About = () => (
    <div className="bg-white pb-16">
        {/* Hero */}
        <section className="bg-navy-700 text-white">
            <div className="container-page py-14 sm:py-20">
                <span className="inline-block bg-primary-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                    About eventHub
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-3xl text-white">
                    The easiest way to discover Berlin's best events.
                </h1>
                <p className="mt-4 text-white/85 text-lg max-w-2xl">
                    From sold-out concerts at the Mercedes-Benz Arena to intimate jazz nights in Kreuzberg, eventHub puts the city's nightlife, theatre, sport and culture in one place.
                </p>
            </div>
        </section>

        {/* Values */}
        <section className="container-page py-12 sm:py-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <ValueCard
                    icon={<Sparkles size={20} />}
                    title="Curated, not crowded"
                    text="A handpicked selection of events you'll actually want to go to — no spam, no fakes."
                />
                <ValueCard
                    icon={<ShieldCheck size={20} />}
                    title="Verified organisers"
                    text="Every organiser is reviewed by our team before their events go live."
                />
                <ValueCard
                    icon={<Heart size={20} />}
                    title="Made for Berlin"
                    text="Built with the city's venues and music scene in mind, by locals who care."
                />
                <ValueCard
                    icon={<Headphones size={20} />}
                    title="Real human support"
                    text="Tickets stuck? We've got a team in Berlin ready to help — not a bot."
                />
            </div>
        </section>

        {/* Story */}
        <section className="container-page pb-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-navy-600 mb-4">Our story</h2>
                    <p className="text-slate-700 leading-relaxed mb-3">
                        eventHub started in 2024 in a Friedrichshain back-room, born from a simple frustration: in a city this rich, finding and booking a great evening shouldn't take twelve browser tabs.
                    </p>
                    <p className="text-slate-700 leading-relaxed mb-3">
                        We work with hundreds of organisers — from underground techno collectives to philharmonic orchestras — to bring you a single, trustworthy place to discover what's on.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                        Our promise: secure checkout, fair prices, and a team that has your back if anything goes wrong.
                    </p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-card-hover aspect-[4/3]">
                    <img
                        src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=70"
                        alt="A Berlin venue at night"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="container-page">
            <div className="rounded-2xl bg-navy-600 text-white p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ready to find your next night out?</h2>
                <p className="text-white/85 mb-6">Browse hundreds of upcoming events in Berlin.</p>
                <Link to="/" className="btn btn-primary btn-lg">Explore events</Link>
            </div>
        </section>
    </div>
);

const ValueCard = ({ icon, title, text }) => (
    <div className="card text-left">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
            {icon}
        </div>
        <h3 className="font-bold text-navy-600 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
);

export default About;
