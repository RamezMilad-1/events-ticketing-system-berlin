import { Music, Drama, Trophy, Mic, Sparkles, Utensils } from 'lucide-react';

const CATEGORY_TILES = [
    {
        key: 'concert',
        label: 'Concerts',
        icon: Music,
        gradient: 'from-fuchsia-600 via-rose-500 to-orange-500',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=70&auto=format&fit=crop',
    },
    {
        key: 'party',
        label: 'Nightlife',
        icon: Sparkles,
        gradient: 'from-violet-600 via-fuchsia-600 to-pink-500',
        image: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&q=70&auto=format&fit=crop',
    },
    {
        key: 'theater',
        label: 'Theatre & Arts',
        icon: Drama,
        gradient: 'from-amber-500 via-orange-500 to-rose-600',
        image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=70&auto=format&fit=crop',
    },
    {
        key: 'sports',
        label: 'Sports',
        icon: Trophy,
        gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
        image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=70&auto=format&fit=crop',
    },
    {
        key: 'conference',
        label: 'Conferences',
        icon: Mic,
        gradient: 'from-blue-600 via-sky-500 to-cyan-500',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70&auto=format&fit=crop',
    },
    {
        key: 'food',
        label: 'Food & Drink',
        icon: Utensils,
        gradient: 'from-orange-500 via-red-500 to-rose-600',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70&auto=format&fit=crop',
    },
];

const CategoryTiles = ({ events = [], onSelect }) => {
    const counts = events.reduce((acc, ev) => {
        const k = ev.category || 'other';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
    }, {});

    return (
        <section className="container-page py-12 sm:py-16">
            <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Explore top categories</h2>
                <p className="text-sm text-slate-500 mt-1">Find your scene — from sold-out concerts to intimate theatre nights.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {CATEGORY_TILES.map(({ key, label, icon: Icon, gradient, image }) => {
                    const count = counts[key] || 0;
                    return (
                        <button
                            type="button"
                            key={key}
                            onClick={() => onSelect?.(key)}
                            className="group relative aspect-[4/3] overflow-hidden rounded-2xl text-left shadow-card hover:shadow-card-hover transition-shadow"
                        >
                            <img
                                src={image}
                                alt={label}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-60 transition-opacity`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

                            <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5 text-white">
                                <Icon size={22} strokeWidth={2} className="opacity-95" />
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold leading-tight">{label}</h3>
                                    <p className="text-xs sm:text-sm text-white/85 mt-0.5">
                                        {count} {count === 1 ? 'event' : 'events'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default CategoryTiles;
