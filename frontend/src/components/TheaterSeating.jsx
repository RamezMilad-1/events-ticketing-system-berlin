import React, { useState, useEffect } from 'react';

const TheaterSeating = ({ event, selectedSeats, onSeatSelect, maxSelectable = 10, bookedSeats = [] }) => {
    const [seatingLayout, setSeatingLayout] = useState([]);

    useEffect(() => {
        if (event.custom_fields && event.custom_fields.seating_rows && event.custom_fields.seating_columns) {
            const rows = event.custom_fields.seating_rows || 10;
            const columns = event.custom_fields.seating_columns || 20;
            
            // Create seating layout with ticket type zones
            const layout = [];
            
            for (let row = 1; row <= rows; row++) {
                const rowSeats = [];
                
                // Determine ticket type for this row (simple zoning)
                let ticketType = 'general';
                if (event.ticketTypes && event.ticketTypes.length > 1) {
                    if (row <= Math.floor(rows * 0.3)) {
                        ticketType = event.ticketTypes[0]?.type || 'orchestra'; // Front rows
                    } else if (row <= Math.floor(rows * 0.7)) {
                        ticketType = event.ticketTypes[1]?.type || 'mezzanine'; // Middle rows
                    } else {
                        ticketType = event.ticketTypes[2]?.type || 'balcony'; // Back rows
                    }
                } else if (event.ticketTypes && event.ticketTypes.length === 1) {
                    ticketType = event.ticketTypes[0]?.type || 'general';
                }
                
                for (let col = 1; col <= columns; col++) {
                    const seatId = `${row}-${col}`;
                    const isBooked = bookedSeats.includes(seatId);
                    rowSeats.push({
                        id: seatId,
                        row,
                        column: col,
                        ticketType,
                        status: isBooked ? 'booked' : 'available'
                    });
                }
                layout.push(rowSeats);
            }
            setSeatingLayout(layout);
        }
    }, [event]);

    const handleSeatClick = (seat) => {
        // If maxSelectable is 0, disable all seat selection
        if (maxSelectable === 0) {
            return;
        }

        if (seat.status === 'available') {
            const isSelected = selectedSeats.includes(seat.id);
            if (!isSelected && selectedSeats.length >= maxSelectable) {
                alert(`You can select a maximum of ${maxSelectable} seats.`);
                return;
            }
            onSeatSelect(seat.id);
        }
    };

    const getSeatClass = (seat) => {
        const baseClass = "w-6 h-6 m-1 rounded border-2 cursor-pointer transition-all duration-200 ";
        const isSelected = selectedSeats.includes(seat.id);

        // If maxSelectable is 0, show as disabled
        if (maxSelectable === 0) {
            return baseClass + "bg-gray-300 border-gray-400 cursor-not-allowed opacity-60";
        }

        if (seat.status === 'booked') {
            return baseClass + "bg-gray-800 border-gray-900 cursor-not-allowed text-white";
        } else if (isSelected) {
            return baseClass + "bg-blue-500 border-blue-600 text-white";
        } else {
            // Color code based on ticket type
            switch (seat.ticketType) {
                case 'orchestra':
                case event.ticketTypes?.[0]?.type:
                    return baseClass + "bg-green-600 border-green-700 hover:bg-green-700";
                case 'mezzanine':
                case event.ticketTypes?.[1]?.type:
                    return baseClass + "bg-yellow-500 border-yellow-600 hover:bg-yellow-600";
                case 'balcony':
                case event.ticketTypes?.[2]?.type:
                    return baseClass + "bg-purple-500 border-purple-600 hover:bg-purple-600";
                default:
                    return baseClass + "bg-gray-400 border-gray-500 hover:bg-gray-500";
            }
        }
    };

    if (!event.custom_fields || !event.custom_fields.seating_rows) {
        return (
            <div className="text-center text-gray-500 p-4">
                Seating layout not available for this event.
            </div>
        );
    }

    return (
        <div className="theater-seating bg-gray-900 p-6 rounded-lg">
            {/* Stage */}
            <div className="stage mb-8">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-16 rounded-t-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">STAGE</span>
                </div>
                <div className="bg-gradient-to-r from-purple-800 to-pink-800 h-4 rounded-b-lg"></div>
            </div>

            {/* Screen/Curtain effect */}
            <div className="curtain mb-6 text-center">
                <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                    CURTAIN
                </div>
            </div>

            {/* Seating Area */}
            <div className="seating-area overflow-x-auto">
                <div className="flex justify-center">
                    <div className="inline-block">
                        {seatingLayout.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex items-center mb-2">
                                {/* Row label */}
                                <div className="w-8 text-center text-white font-semibold mr-2">
                                    {String.fromCharCode(65 + rowIndex)}
                                </div>

                                {/* Seats */}
                                <div className="flex">
                                    {row.map((seat) => (
                                        <button
                                            key={seat.id}
                                            className={getSeatClass(seat)}
                                            onClick={() => handleSeatClick(seat)}
                                            disabled={maxSelectable === 0 || seat.status === 'booked'}
                                            title={`Row ${String.fromCharCode(65 + rowIndex)}, Seat ${seat.column}`}
                                        >
                                            {seat.column}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="legend mt-6 flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded mr-2"></div>
                    <span className="text-white">Selected</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded mr-2"></div>
                    <span className="text-white">Booked</span>
                </div>
                {event.ticketTypes && event.ticketTypes.map((ticketType, index) => {
                    const colorClass = index === 0 ? "bg-green-600 border-green-700" :
                                     index === 1 ? "bg-yellow-500 border-yellow-600" :
                                     "bg-purple-500 border-purple-600";
                    return (
                        <div key={ticketType.type} className="flex items-center">
                            <div className={`w-4 h-4 ${colorClass} rounded mr-2`}></div>
                            <span className="text-white">{ticketType.type}: ${ticketType.price}</span>
                        </div>
                    );
                })}
            </div>

            {/* Selected seats info */}
            {selectedSeats.length > 0 && (
                <div className="selected-seats mt-4 p-3 bg-blue-900 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Selected Seats:</h4>
                    <div className="text-blue-200">
                        {selectedSeats.map(seatId => {
                            const [row, col] = seatId.split('-');
                            return `Row ${String.fromCharCode(64 + parseInt(row))}, Seat ${col}`;
                        }).join(', ')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TheaterSeating;