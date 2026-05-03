import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const daysUntilEvent = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
    const isUpcoming = daysUntilEvent > 0;

    // Calculate available tickets and pricing based on ticket system
    let availableTickets = 0;
    let priceDisplay = '';
    let isSoldOut = false;

    if (event.ticketTypes && event.ticketTypes.length > 0) {
        // New ticket types system
        availableTickets = event.ticketTypes.reduce((total, ticket) => total + ticket.remaining, 0);
        const prices = event.ticketTypes.map(ticket => ticket.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        priceDisplay = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;
        isSoldOut = availableTickets === 0;
    } else {
        // Legacy system
        availableTickets = event.remainingTickets || 0;
        priceDisplay = event.ticketPrice ? `$${event.ticketPrice}` : 'Price TBA';
        isSoldOut = availableTickets === 0;
    }

    return (
        <Link to={`/events/${event._id}`} className="group">
            <div className="card-hover overflow-hidden h-full cursor-pointer">
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                    {event.image && (
                        <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white text-sm font-semibold">View Details</p>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {isUpcoming && daysUntilEvent <= 7 && (
                            <span className="badge badge-danger text-xs">🔥 Ending Soon</span>
                        )}
                        {isSoldOut && (
                            <span className="badge bg-gray-600 text-white text-xs">Sold Out</span>
                        )}
                    </div>

                    {/* Date Badge */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg">
                        <p className="text-xs font-semibold text-indigo-600">{formattedDate}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Category */}
                    {event.category && (
                        <span className="badge badge-primary text-xs mb-3">
                            {event.category}
                        </span>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {event.description}
                    </p>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Ticket Price</p>
                            <p className="text-xl font-bold text-indigo-600">
                                {priceDisplay}
                            </p>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Available</p>
                            <p className={`text-lg font-semibold ${isSoldOut ? 'text-red-600' : 'text-green-600'}`}>
                                {isSoldOut ? 'Sold Out' : `${availableTickets} left`}
                            </p>
                        </div>
                    </div>

                    {/* Button */}
                    <button className="w-full mt-4 btn btn-primary btn-sm group-hover:shadow-lg transition-all">
                        {isSoldOut ? 'Sold Out' : 'View & Book'}
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default EventCard; 