import { useEffect, useState } from 'react';
import { MapPin, Clock, Phone, CreditCard } from 'lucide-react';
import { outletService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';

// Mirror of the reference site's outlets page — physical box-office locations.
// On a fresh install the backend collection is empty, so we fall back to a curated
// Berlin demo set so the page never looks unfinished.
const DEMO_OUTLETS = [
    {
        _id: 'demo-mitte',
        name: 'EarlyHub Mitte',
        address: 'Friedrichstraße 200',
        city: 'Berlin',
        country: 'Germany',
        phone: '+49 30 1234 5678',
        workingHours: 'Mon–Sat 10:00 – 21:00 · Sun 12:00 – 19:00',
        paymentMethods: ['cash', 'visa', 'mastercard'],
        image:
            'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=70',
    },
    {
        _id: 'demo-kreuzberg',
        name: 'EarlyHub Kreuzberg',
        address: 'Oranienstraße 45',
        city: 'Berlin',
        country: 'Germany',
        phone: '+49 30 2345 6789',
        workingHours: 'Tue–Sun 13:00 – 22:00',
        paymentMethods: ['cash', 'visa', 'mastercard'],
        image:
            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=900&q=70',
    },
    {
        _id: 'demo-prenzlauer',
        name: 'EarlyHub Prenzlauer Berg',
        address: 'Kastanienallee 18',
        city: 'Berlin',
        country: 'Germany',
        phone: '+49 30 3456 7890',
        workingHours: 'Mon–Fri 10:00 – 20:00 · Sat 11:00 – 18:00',
        paymentMethods: ['cash', 'visa'],
        image:
            'https://images.unsplash.com/photo-1551867633-194f125bddfa?auto=format&fit=crop&w=900&q=70',
    },
    {
        _id: 'demo-charlottenburg',
        name: 'EarlyHub Charlottenburg',
        address: 'Kurfürstendamm 234',
        city: 'Berlin',
        country: 'Germany',
        phone: '+49 30 4567 8901',
        workingHours: 'Mon–Sat 09:00 – 20:00',
        paymentMethods: ['cash', 'visa', 'mastercard'],
        image:
            'https://images.unsplash.com/photo-1587330979470-3016b6702d89?auto=format&fit=crop&w=900&q=70',
    },
    {
        _id: 'demo-friedrichshain',
        name: 'EarlyHub Friedrichshain',
        address: 'Warschauer Straße 70',
        city: 'Berlin',
        country: 'Germany',
        phone: '+49 30 5678 9012',
        workingHours: 'Wed–Sun 14:00 – 23:00',
        paymentMethods: ['cash', 'visa'],
        image:
            'https://images.unsplash.com/photo-1564076537430-dee08bcd05ee?auto=format&fit=crop&w=900&q=70',
    },
    {
        _id: 'demo-tempelhof',
        name: 'EarlyHub Tempelhof',
        address: 'Tempelhofer Damm 165',
        city: 'Berlin',
        country: 'Germany',
        phone: '+49 30 6789 0123',
        workingHours: 'Mon–Sat 10:00 – 19:00',
        paymentMethods: ['cash', 'mastercard'],
        image:
            'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=900&q=70',
    },
];

const PAYMENT_LABELS = {
    cash: 'Cash',
    visa: 'Visa',
    mastercard: 'Mastercard',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    sepa: 'SEPA',
};

const Outlets = () => {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await outletService.list();
                const list = data?.data || data || [];
                setOutlets(list.length > 0 ? list : DEMO_OUTLETS);
            } catch {
                setOutlets(DEMO_OUTLETS);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <Loader fullScreen label="Loading outlets…" />;

    return (
        <div className="bg-surface-200/40 min-h-screen pb-16">
            {/* Hero */}
            <div className="bg-navy-700 text-white">
                <div className="container-page py-12 sm:py-16">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Our outlets</h1>
                    <p className="max-w-2xl text-white/85">
                        Visit any of our box offices in Berlin to buy tickets in person — cash welcome. We're open daily and our staff can help you find the perfect event.
                    </p>
                </div>
            </div>

            <section className="container-page py-10">
                {outlets.length === 0 ? (
                    <EmptyState
                        icon="📍"
                        title="No outlets listed yet"
                        description="Check back soon — new locations are coming."
                    />
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {outlets.map((outlet) => (
                            <OutletCard key={outlet._id || outlet.name} outlet={outlet} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const OutletCard = ({ outlet }) => (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card hover:shadow-card-hover transition">
        <div className="aspect-[4/3] overflow-hidden bg-surface-200">
            {outlet.image ? (
                <img src={outlet.image} alt={outlet.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <MapPin size={48} strokeWidth={1.5} />
                </div>
            )}
        </div>
        <div className="p-5 space-y-3">
            <div>
                <h3 className="text-lg font-bold text-navy-600">{outlet.name}</h3>
                <p className="text-sm text-slate-500">{outlet.city || 'Berlin'}</p>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex gap-2 text-slate-700">
                    <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
                    <span>{outlet.address}</span>
                </div>
                {outlet.workingHours && (
                    <div className="flex gap-2 text-slate-700">
                        <Clock size={15} className="mt-0.5 text-slate-400 shrink-0" />
                        <span>{outlet.workingHours}</span>
                    </div>
                )}
                {outlet.phone && (
                    <div className="flex gap-2 text-slate-700">
                        <Phone size={15} className="mt-0.5 text-slate-400 shrink-0" />
                        <a href={`tel:${outlet.phone}`} className="hover:text-primary-600 transition">
                            {outlet.phone}
                        </a>
                    </div>
                )}
            </div>

            {outlet.paymentMethods?.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                        <CreditCard size={12} /> Payment methods
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {outlet.paymentMethods.map((m) => (
                            <span key={m} className="badge badge-neutral capitalize">
                                {PAYMENT_LABELS[m] || m}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </article>
);

export default Outlets;
