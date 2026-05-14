// Centralised formatting helpers — currency stays in EUR throughout the app.

const priceFormatter = new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

const priceFormatterWithCents = new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatPrice = (n, { withCents = false } = {}) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return '€0';
    return withCents ? priceFormatterWithCents.format(num) : priceFormatter.format(num);
};

export const formatPriceRange = (min, max) => {
    if (min == null && max == null) return '';
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} – ${formatPrice(max)}`;
};

export const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export const formatDateTime = (d) =>
    new Date(d).toLocaleString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const formatDateShort = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
    });

export const formatTime = (d) =>
    new Date(d).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });

export const getMinPrice = (event) => {
    if (event?.ticketTypes?.length > 0) {
        return Math.min(...event.ticketTypes.map((t) => t.price));
    }
    return event?.ticketPrice ?? 0;
};

export const getMaxPrice = (event) => {
    if (event?.ticketTypes?.length > 0) {
        return Math.max(...event.ticketTypes.map((t) => t.price));
    }
    return event?.ticketPrice ?? 0;
};

export const getAvailableTickets = (event) => {
    if (event?.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce((sum, t) => sum + (t.remaining || 0), 0);
    }
    return event?.remainingTickets ?? 0;
};

export const getTotalTickets = (event) => {
    if (event?.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
    }
    return event?.totalTickets ?? 0;
};

export const getSoldCount = (event) => {
    if (event?.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce(
            (sum, t) => sum + Math.max(0, (t.quantity || 0) - (t.remaining || 0)),
            0
        );
    }
    return Math.max(0, (event?.totalTickets || 0) - (event?.remainingTickets || 0));
};
