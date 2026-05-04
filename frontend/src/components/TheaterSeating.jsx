import { useMemo } from 'react';
import { toast } from 'react-toastify';

/**
 * Cinema-style theater seat picker.
 *
 * Layout source-of-truth:
 *   1. event.custom_fields.seating_rows × seating_columns (preferred)
 *   2. Fallback: derive a near-square grid from the total ticket count,
 *      so events created without explicit seating still render a sensible map.
 *
 * Visual:
 *   - Stage at top with lights and curtain
 *   - Two seat blocks separated by a center aisle
 *   - Row numbers on both sides
 *   - Color zones for ticket tiers (front / middle / back)
 *   - Available = red, Selected = green, Booked = dark gray
 */

// Decide rows × columns. Prefers explicit fields, otherwise picks a
// near-square layout so every ticket has a seat.
const computeLayoutDimensions = (event) => {
    const rowsField = Number(event?.custom_fields?.seating_rows);
    const colsField = Number(event?.custom_fields?.seating_columns);

    if (rowsField > 0 && colsField > 0) {
        return { rows: rowsField, columns: colsField };
    }

    const totalSeats =
        (event?.ticketTypes?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0) ||
        event?.totalTickets ||
        200;

    // Aim for slightly wider than tall (typical theater)
    const cols = Math.max(6, Math.ceil(Math.sqrt(totalSeats * 1.4)));
    const rows = Math.max(3, Math.ceil(totalSeats / cols));
    return { rows, columns: cols };
};

// Map a row number to a ticket tier (front/middle/back zoning).
const tierForRow = (row, totalRows, ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return null;
    if (ticketTypes.length === 1) return ticketTypes[0];
    if (ticketTypes.length === 2) {
        return row <= Math.ceil(totalRows / 2) ? ticketTypes[0] : ticketTypes[1];
    }
    if (row <= Math.floor(totalRows * 0.3)) return ticketTypes[0];
    if (row <= Math.floor(totalRows * 0.7)) return ticketTypes[1];
    return ticketTypes[2];
};

// Tailwind color classes per tier index (used in legend AND seat colors).
const TIER_COLOR_CLASSES = [
    'bg-rose-500 hover:bg-rose-600 border-rose-700', // front
    'bg-amber-500 hover:bg-amber-600 border-amber-700', // middle
    'bg-violet-500 hover:bg-violet-600 border-violet-700', // back
];

const SEAT_BASE = 'rounded-t-md border-b-2 transition-all duration-150 cursor-pointer flex items-center justify-center text-[9px] font-bold leading-none';

const TheaterSeating = ({
    event,
    selectedSeats = [],
    onSeatSelect,
    maxSelectable = 10,
    bookedSeats = [],
}) => {
    const { rows, columns } = useMemo(() => computeLayoutDimensions(event), [event]);

    const layout = useMemo(() => {
        const grid = [];
        for (let row = 1; row <= rows; row++) {
            const tier = tierForRow(row, rows, event.ticketTypes);
            const tierIndex = event.ticketTypes
                ? Math.max(0, event.ticketTypes.findIndex((t) => t.type === tier?.type))
                : 0;

            const rowSeats = [];
            for (let col = 1; col <= columns; col++) {
                const seatId = `${row}-${col}`;
                rowSeats.push({
                    id: seatId,
                    row,
                    column: col,
                    tier,
                    tierIndex,
                    isBooked: bookedSeats.includes(seatId),
                });
            }
            grid.push(rowSeats);
        }
        return grid;
    }, [rows, columns, event.ticketTypes, bookedSeats]);

    // The aisle splits each row into two blocks of equal size when columns is even,
    // and gives the right block one extra seat when it's odd.
    const leftBlockSize = Math.floor(columns / 2);

    const handleSeatClick = (seat) => {
        if (maxSelectable === 0) return;
        if (seat.isBooked) return;

        const isSelected = selectedSeats.includes(seat.id);
        if (!isSelected && selectedSeats.length >= maxSelectable) {
            toast.warn(`You can select up to ${maxSelectable} seats.`);
            return;
        }
        onSeatSelect(seat.id);
    };

    const seatClass = (seat) => {
        const isSelected = selectedSeats.includes(seat.id);
        if (seat.isBooked) {
            return `${SEAT_BASE} bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed`;
        }
        if (isSelected) {
            return `${SEAT_BASE} bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white`;
        }
        const colorIdx =
            event.ticketTypes && event.ticketTypes.length > 0
                ? Math.min(seat.tierIndex, TIER_COLOR_CLASSES.length - 1)
                : 0;
        return `${SEAT_BASE} ${TIER_COLOR_CLASSES[colorIdx]} text-white`;
    };

    // Sizing: scale seat size down a bit if there are too many columns to fit.
    const seatSize = columns > 22 ? 'w-5 h-5' : columns > 16 ? 'w-6 h-6' : 'w-7 h-7';
    const seatGap = columns > 22 ? 'gap-0.5' : 'gap-1';

    const renderRow = (rowSeats, rowIndex) => {
        const left = rowSeats.slice(0, leftBlockSize);
        const right = rowSeats.slice(leftBlockSize);
        return (
            <div key={rowIndex} className="flex items-center gap-2 sm:gap-3">
                {/* Row label (left) */}
                <div className="w-6 text-center text-xs font-bold text-slate-300">{rowIndex + 1}</div>

                {/* Left block */}
                <div className={`flex ${seatGap} flex-1 justify-end`}>
                    {left.map((seat) => (
                        <button
                            key={seat.id}
                            type="button"
                            disabled={seat.isBooked || maxSelectable === 0}
                            onClick={() => handleSeatClick(seat)}
                            title={`Row ${seat.row}, Seat ${seat.column}${seat.tier ? ` (${seat.tier.type} — €${seat.tier.price})` : ''}`}
                            className={`${seatSize} ${seatClass(seat)}`}
                            aria-label={`Row ${seat.row} seat ${seat.column}`}
                        >
                            {seat.column}
                        </button>
                    ))}
                </div>

                {/* Center aisle */}
                <div className="w-6 sm:w-8 shrink-0" aria-hidden="true" />

                {/* Right block */}
                <div className={`flex ${seatGap} flex-1`}>
                    {right.map((seat) => (
                        <button
                            key={seat.id}
                            type="button"
                            disabled={seat.isBooked || maxSelectable === 0}
                            onClick={() => handleSeatClick(seat)}
                            title={`Row ${seat.row}, Seat ${seat.column}${seat.tier ? ` (${seat.tier.type} — €${seat.tier.price})` : ''}`}
                            className={`${seatSize} ${seatClass(seat)}`}
                            aria-label={`Row ${seat.row} seat ${seat.column}`}
                        >
                            {seat.column}
                        </button>
                    ))}
                </div>

                {/* Row label (right) */}
                <div className="w-6 text-center text-xs font-bold text-slate-300">{rowIndex + 1}</div>
            </div>
        );
    };

    return (
        <div className="rounded-2xl bg-slate-950 p-4 sm:p-6 shadow-inner overflow-x-auto">
            {/* Stage with lights */}
            <div className="relative mb-8">
                <div className="mx-auto w-3/4 max-w-2xl">
                    <div className="relative h-12 rounded-lg bg-gradient-to-b from-white via-slate-100 to-slate-300 shadow-[0_0_60px_15px_rgba(255,255,255,0.35)]" />
                    {/* spotlights */}
                    <div className="-mt-2 flex justify-around px-6">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-3 w-3 rounded-full bg-yellow-200 shadow-[0_0_18px_6px_rgba(254,240,138,0.6)]"
                            />
                        ))}
                    </div>
                </div>

                {/* Curtain band */}
                <div className="mt-3 h-3 rounded-sm bg-gradient-to-r from-rose-900 via-rose-700 to-rose-900" />
                <div className="mt-1 text-center text-[10px] uppercase tracking-[0.4em] text-slate-500">
                    Stage
                </div>
            </div>

            {/* Seat grid */}
            <div className="space-y-1.5 min-w-fit">
                {layout.map((rowSeats, rowIndex) => renderRow(rowSeats, rowIndex))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-300">
                <LegendDot className="bg-emerald-500 border-emerald-700" label="Selected" />
                <LegendDot className="bg-slate-700 border-slate-900" label="Booked" />
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                    event.ticketTypes.map((tier, i) => (
                        <LegendDot
                            key={tier.type}
                            className={TIER_COLOR_CLASSES[Math.min(i, TIER_COLOR_CLASSES.length - 1)]}
                            label={`${tier.type} — €${tier.price}`}
                        />
                    ))
                ) : (
                    <LegendDot className="bg-rose-500 border-rose-700" label="Available" />
                )}
            </div>

            {/* Selected summary */}
            {selectedSeats.length > 0 && (
                <div className="mt-6 rounded-xl bg-slate-900 ring-1 ring-slate-700 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                        Selected seats ({selectedSeats.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seatId) => {
                            const [r, c] = seatId.split('-');
                            return (
                                <span
                                    key={seatId}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-300 ring-1 ring-emerald-500/40"
                                >
                                    R{r}·S{c}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const LegendDot = ({ className, label }) => (
    <div className="flex items-center gap-1.5">
        <span className={`inline-block h-3 w-3 rounded-sm border-b-2 ${className}`} />
        <span>{label}</span>
    </div>
);

export default TheaterSeating;
