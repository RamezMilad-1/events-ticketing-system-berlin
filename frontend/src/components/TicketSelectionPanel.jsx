import { useMemo, useState } from 'react';
import { Minus, Plus, Ticket, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../utils/format';

/**
 * Sticky right-rail ticket panel for the event detail page. On mobile it collapses
 * to a sticky bottom bar that can expand into a full sheet.
 *
 * Props:
 *   tiers          — [{ type, price, quantity, remaining }]
 *   onCheckout(tickets, totals) — called when user clicks Book now
 *   isSoldOut, ctaLabel, disabled
 */
const TicketSelectionPanel = ({ tiers = [], onCheckout, isSoldOut, ctaLabel = 'Book now', disabled = false, footnote }) => {
    const [qty, setQty] = useState(() => Object.fromEntries(tiers.map((t) => [t.type, 0])));

    const totals = useMemo(() => {
        const lines = tiers
            .map((t) => {
                const q = qty[t.type] || 0;
                return q > 0 ? { type: t.type, price: t.price, quantity: q, subtotal: q * t.price } : null;
            })
            .filter(Boolean);
        const total = lines.reduce((s, l) => s + l.subtotal, 0);
        const totalCount = lines.reduce((s, l) => s + l.quantity, 0);
        return { lines, total, totalCount };
    }, [tiers, qty]);

    const adjust = (type, delta, max) => {
        setQty((q) => {
            const next = Math.max(0, Math.min((q[type] || 0) + delta, max));
            return { ...q, [type]: next };
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 sm:p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
                <Ticket size={18} className="text-primary-500" />
                <h3 className="text-base font-bold text-navy-600">Select tickets</h3>
            </div>

            {tiers.length === 0 ? (
                <p className="text-sm text-slate-500">No ticket tiers configured for this event.</p>
            ) : (
                <ul className="space-y-3">
                    {tiers.map((tier) => {
                        const remaining = tier.remaining ?? 0;
                        const total = tier.quantity ?? 0;
                        const tierSoldOut = remaining === 0;
                        const lowStock = !tierSoldOut && remaining <= 10;
                        const value = qty[tier.type] || 0;

                        return (
                            <li
                                key={tier.type}
                                className={`rounded-xl border ${
                                    tierSoldOut ? 'border-slate-200 bg-slate-50' : 'border-slate-200'
                                } p-3.5`}
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-navy-600 capitalize leading-tight">
                                            {tier.type.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 mt-0.5">{formatPrice(tier.price)}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                        {tierSoldOut ? (
                                            <span className="badge badge-neutral">Sold out</span>
                                        ) : lowStock ? (
                                            <span className="badge badge-warning">Only {remaining} left</span>
                                        ) : (
                                            <span className="text-slate-400">
                                                {remaining} / {total}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        {value > 0 && `Subtotal: ${formatPrice(value * tier.price)}`}
                                    </span>
                                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                                        <button
                                            type="button"
                                            onClick={() => adjust(tier.type, -1, remaining)}
                                            disabled={tierSoldOut || value === 0}
                                            className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                            aria-label={`Decrease ${tier.type}`}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-slate-900">{value}</span>
                                        <button
                                            type="button"
                                            onClick={() => adjust(tier.type, +1, remaining)}
                                            disabled={tierSoldOut || value >= remaining}
                                            className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                            aria-label={`Increase ${tier.type}`}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-500">
                        Total {totals.totalCount > 0 ? `· ${totals.totalCount} ${totals.totalCount === 1 ? 'ticket' : 'tickets'}` : ''}
                    </span>
                    <span className="text-2xl font-extrabold text-navy-600">{formatPrice(totals.total)}</span>
                </div>

                <button
                    type="button"
                    onClick={() => onCheckout?.(totals.lines, totals)}
                    disabled={isSoldOut || disabled || totals.totalCount === 0}
                    className="btn btn-primary w-full mt-3 btn-lg"
                >
                    {isSoldOut ? 'Sold out' : ctaLabel}
                </button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck size={13} />
                    Secure checkout · Refundable up to 24h before
                </p>
                {footnote && <p className="mt-2 text-xs text-center text-slate-500">{footnote}</p>}
            </div>
        </div>
    );
};

export default TicketSelectionPanel;
