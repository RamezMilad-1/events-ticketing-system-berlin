import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TheaterSeating from './TheaterSeating';

const SeatSelectionModal = ({ event, isOpen, onClose, bookedSeats = [] }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const navigate = useNavigate();

    const handleSeatSelect = (seatId) => {
        setSelectedSeats(prev => {
            if (prev.includes(seatId)) {
                return prev.filter(id => id !== seatId);
            } else if (prev.length < 5) {
                return [...prev, seatId];
            }
            return prev;
        });
    };

    const handleConfirmSelection = () => {
        if (selectedSeats.length > 0) {
            // Navigate to booking page with selected seats
            navigate(`/booking/${event._id}?selectedSeats=${selectedSeats.join(',')}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Select Your Seats</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-slate-600 mt-2">
                        Select up to 5 seats. Selected: {selectedSeats.length}/5
                    </p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <TheaterSeating
                        event={event}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelect}
                        maxSelectable={5}
                        bookedSeats={bookedSeats}
                    />
                </div>

                <div className="p-6 border-t bg-slate-50">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-600">
                            {selectedSeats.length > 0 && (
                                <span>
                                    Selected seats: {selectedSeats.join(', ')}
                                </span>
                            )}
                        </div>
                        <div className="space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                disabled={selectedSeats.length === 0}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm Selection ({selectedSeats.length} seats)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatSelectionModal;