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
        <section className="container-page py-8 sm:py-10">
            <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore top categories</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Find your scene — from sold-out concerts to intimate theatre nights.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {CATEGORY_TILES.map(({ key, label, icon: Icon, gradient, image }) => {
                    const count = counts[key] || 0;
                    return (
                        <button
                            type="button"
                            key={key}
                            onClick={() => onSelect?.(key)}
                            className="group relative aspect-[5/4] overflow-hidden rounded-2xl text-left shadow-card hover:shadow-card-hover transition-shadow"
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
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/15 to-transparent" />

                            <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-4 text-white">
                                <Icon size={20} strokeWidth={2} className="opacity-95 drop-shadow" />
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold leading-tight text-white drop-shadow">{label}</h3>
                                    <p className="text-[11px] sm:text-xs text-white/90 mt-0.5 drop-shadow">
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
