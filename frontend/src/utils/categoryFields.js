// Category field definitions for frontend
export const categoryFields = {
    concert: {
        artists: { type: 'array', label: 'Artists', placeholder: 'Add artist names', required: true },
        genres: { type: 'array', label: 'Genres', placeholder: 'Add music genres', required: false },
        lineup_schedule: {
            type: 'array',
            label: 'Lineup Schedule',
            placeholder: 'Add schedule items',
            required: false,
            itemType: 'object',
            fields: [
                { name: 'artist', label: 'Artist', type: 'select', required: true, optionsKey: 'artists' },
                { name: 'time', label: 'Time', type: 'time', required: true }
            ]
        },
        stages: { type: 'array', label: 'Stages', placeholder: 'Add stage names', required: false },
        ticket_types: {
            type: 'array',
            label: 'Ticket Types',
            placeholder: 'Add ticket types',
            required: false,
            itemType: 'object',
            fields: [
                { name: 'type', label: 'Type', type: 'text', required: true },
                { name: 'price', label: 'Price ($)', type: 'number', required: true },
                { name: 'quantity', label: 'Quantity', type: 'number', required: true }
            ],
            default: [
                { type: 'general', price: 50, quantity: 1000 },
                { type: 'vip', price: 100, quantity: 200 },
                { type: 'backstage', price: 200, quantity: 50 }
            ]
        }
    },
    theater: {
        performers: { type: 'array', label: 'Performers', placeholder: 'Add performer names', required: true },
        duration_minutes: { type: 'number', label: 'Duration (minutes)', placeholder: '120', required: true },
        intermission: { type: 'boolean', label: 'Has Intermission', required: false },
        seating_rows: {
            type: 'number',
            label: 'Number of Rows',
            placeholder: '10',
            required: true,
            min: 1,
            max: 50,
            default: 10,
        },
        seating_columns: {
            type: 'number',
            label: 'Seats per Row',
            placeholder: '20',
            required: true,
            min: 1,
            max: 50,
            default: 20,
        },
        ticket_types: {
            type: 'array',
            label: 'Ticket Types',
            placeholder: 'Add ticket types',
            required: false,
            itemType: 'object',
            fields: [
                { name: 'type', label: 'Type', type: 'text', required: true },
                { name: 'price', label: 'Price ($)', type: 'number', required: true },
                { name: 'quantity', label: 'Quantity', type: 'number', required: true }
            ],
            default: [
                { type: 'orchestra', price: 150, quantity: 100 },
                { type: 'mezzanine', price: 100, quantity: 80 },
                { type: 'balcony', price: 75, quantity: 120 }
            ]
        }
    },
    sports: {
        teams: { type: 'array', label: 'Teams', placeholder: 'Add team names', required: true },
        league: { type: 'text', label: 'League', placeholder: 'e.g., Premier League', required: false },
        match_type: { type: 'text', label: 'Match Type', placeholder: 'e.g., Final, Regular Season', required: false },
        seating_map: { type: 'boolean', label: 'Seating Map Available', required: false }
    },
    conference: {
        speakers: { type: 'array', label: 'Speakers', placeholder: 'Add speaker names', required: true },
        agenda: {
            type: 'array',
            label: 'Agenda',
            placeholder: 'Add agenda items',
            required: false,
            itemType: 'object',
            fields: [
                { name: 'title', label: 'Title', type: 'text', required: true },
                { name: 'time', label: 'Time', type: 'time', required: true }
            ]
        },
        sponsors: { type: 'array', label: 'Sponsors', placeholder: 'Add sponsor names', required: false },
        tracks: { type: 'array', label: 'Tracks', placeholder: 'Add track names', required: false }
    },
    workshop: {
        instructor: { type: 'text', label: 'Instructor', placeholder: 'Instructor name', required: true },
        skill_level: {
            type: 'select',
            label: 'Skill Level',
            required: true,
            options: [
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' }
            ]
        },
        materials_provided: { type: 'boolean', label: 'Materials Provided', required: false },
        max_participants: { type: 'number', label: 'Max Participants', placeholder: '20', required: false }
    },
    party: {
        dj: { type: 'array', label: 'DJ/Performers', placeholder: 'Add DJ or performer names', required: false },
        dress_code: { type: 'text', label: 'Dress Code', placeholder: 'e.g., Casual, Formal', required: false },
        age_restriction: { type: 'number', label: 'Age Restriction', placeholder: '18', required: false },
        table_booking: { type: 'boolean', label: 'Table Booking Available', required: false }
    },
    gaming: {
        game: { type: 'text', label: 'Game', placeholder: 'Game name', required: true },
        teams: { type: 'array', label: 'Teams', placeholder: 'Add team names', required: false },
        tournament_format: { type: 'text', label: 'Tournament Format', placeholder: 'e.g., Single Elimination', required: false },
        prize_pool: { type: 'number', label: 'Prize Pool', placeholder: '1000', required: false }
    },
    food: {
        menu: { type: 'array', label: 'Menu Items', placeholder: 'Add menu items', required: false },
        chefs: { type: 'array', label: 'Chefs', placeholder: 'Add chef names', required: false },
        dietary_options: { type: 'array', label: 'Dietary Options', placeholder: 'Add dietary options', required: false }
    },
    exhibition: {
        artists: { type: 'array', label: 'Artists', placeholder: 'Add artist names', required: false },
        theme: { type: 'text', label: 'Theme', placeholder: 'Exhibition theme', required: false },
        guided_tours: { type: 'boolean', label: 'Guided Tours Available', required: false }
    },
    festival: {
        lineup: { type: 'array', label: 'Lineup', placeholder: 'Add performers/artists', required: false },
        stages: { type: 'array', label: 'Stages', placeholder: 'Add stage names', required: false },
        multi_day: { type: 'boolean', label: 'Multi-day Event', required: false },
        camping: { type: 'boolean', label: 'Camping Available', required: false }
    },
    private: {
        host: { type: 'text', label: 'Host', placeholder: 'Host name', required: true },
        guest_list_enabled: { type: 'boolean', label: 'Guest List Enabled', required: false },
        rsvp_required: { type: 'boolean', label: 'RSVP Required', required: false }
    },
    virtual: {
        platform: { type: 'text', label: 'Platform', placeholder: 'e.g., Zoom, Discord', required: true },
        access_link: { type: 'text', label: 'Access Link', placeholder: 'Meeting link or access code', required: false },
        replay_available: { type: 'boolean', label: 'Replay Available', required: false }
    },
    other: {}
};

export const categoryOptions = [
    { value: 'concert', label: 'Concert' },
    { value: 'theater', label: 'Theater' },
    { value: 'sports', label: 'Sports' },
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'party', label: 'Party' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'food', label: 'Food' },
    { value: 'exhibition', label: 'Exhibition' },
    { value: 'festival', label: 'Festival' },
    { value: 'private', label: 'Private' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'other', label: 'Other' }
];

// Helper function to get default values for custom fields
export const getDefaultCustomFields = (category) => {
    const fields = categoryFields[category] || {};
    const defaults = {};

    Object.entries(fields).forEach(([key, config]) => {
        if (config.default !== undefined) {
            defaults[key] = config.default;
        } else if (config.type === 'array') {
            defaults[key] = [];
        } else if (config.type === 'boolean') {
            defaults[key] = false;
        } else {
            defaults[key] = '';
        }
    });

    return defaults;
};