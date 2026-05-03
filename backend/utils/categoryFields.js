// Category field definitions and validation schemas
const categoryFields = {
    concert: {
        artists: { type: 'array', label: 'Artists', required: true },
        genres: { type: 'array', label: 'Genres', required: false },
        lineup_schedule: { type: 'array', label: 'Lineup Schedule', required: false, itemType: 'object' },
        stages: { type: 'array', label: 'Stages', required: false },
        ticket_types: { 
            type: 'array', 
            label: 'Ticket Types', 
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
        performers: { type: 'array', label: 'Performers', required: true },
        duration_minutes: { type: 'number', label: 'Duration (minutes)', required: true },
        intermission: { type: 'boolean', label: 'Has Intermission', required: false },
        seating_rows: { type: 'number', label: 'Number of Rows', required: true, default: 10 },
        seating_columns: { type: 'number', label: 'Seats per Row', required: true, default: 20 },
        ticket_types: { 
            type: 'array', 
            label: 'Ticket Types', 
            required: false, 
            itemType: 'object',
            fields: [
                { name: 'type', label: 'Type', required: true },
                { name: 'price', label: 'Price ($)', required: true },
                { name: 'quantity', label: 'Quantity', required: true }
            ]
        }
    },
    sports: {
        teams: { type: 'array', label: 'Teams', required: true },
        league: { type: 'string', label: 'League', required: false },
        match_type: { type: 'string', label: 'Match Type', required: false },
        seating_map: { type: 'boolean', label: 'Seating Map Available', required: false }
    },
    conference: {
        speakers: { type: 'array', label: 'Speakers', required: true },
        agenda: { type: 'array', label: 'Agenda', required: false, itemType: 'object' },
        sponsors: { type: 'array', label: 'Sponsors', required: false },
        tracks: { type: 'array', label: 'Tracks', required: false }
    },
    workshop: {
        instructor: { type: 'string', label: 'Instructor', required: true },
        skill_level: { type: 'select', label: 'Skill Level', required: true, options: ['beginner', 'intermediate', 'advanced'] },
        materials_provided: { type: 'boolean', label: 'Materials Provided', required: false },
        max_participants: { type: 'number', label: 'Max Participants', required: false }
    },
    party: {
        dj: { type: 'array', label: 'DJ/Performers', required: false },
        dress_code: { type: 'string', label: 'Dress Code', required: false },
        age_restriction: { type: 'number', label: 'Age Restriction', required: false },
        table_booking: { type: 'boolean', label: 'Table Booking Available', required: false }
    },
    gaming: {
        game: { type: 'string', label: 'Game', required: true },
        teams: { type: 'array', label: 'Teams', required: false },
        tournament_format: { type: 'string', label: 'Tournament Format', required: false },
        prize_pool: { type: 'number', label: 'Prize Pool', required: false }
    },
    food: {
        menu: { type: 'array', label: 'Menu Items', required: false },
        chefs: { type: 'array', label: 'Chefs', required: false },
        dietary_options: { type: 'array', label: 'Dietary Options', required: false }
    },
    exhibition: {
        artists: { type: 'array', label: 'Artists', required: false },
        theme: { type: 'string', label: 'Theme', required: false },
        guided_tours: { type: 'boolean', label: 'Guided Tours Available', required: false }
    },
    festival: {
        lineup: { type: 'array', label: 'Lineup', required: false },
        stages: { type: 'array', label: 'Stages', required: false },
        multi_day: { type: 'boolean', label: 'Multi-day Event', required: false },
        camping: { type: 'boolean', label: 'Camping Available', required: false }
    },
    private: {
        host: { type: 'string', label: 'Host', required: true },
        guest_list_enabled: { type: 'boolean', label: 'Guest List Enabled', required: false },
        rsvp_required: { type: 'boolean', label: 'RSVP Required', required: false }
    },
    virtual: {
        platform: { type: 'string', label: 'Platform', required: true },
        access_link: { type: 'string', label: 'Access Link', required: false },
        replay_available: { type: 'boolean', label: 'Replay Available', required: false }
    },
    other: {}
};

const categoryOptions = [
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

const validateCustomFields = (category, customFields) => {
    const fields = categoryFields[category] || {};
    const errors = [];

    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        const value = customFields[fieldName];

        if (fieldConfig.required && (value === undefined || value === null || value === '')) {
            errors.push(`${fieldConfig.label} is required`);
        }

        // Type validation
        if (value !== undefined && value !== null && value !== '') {
            switch (fieldConfig.type) {
                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push(`${fieldConfig.label} must be an array`);
                    }
                    break;
                case 'number':
                    if (typeof value !== 'number' && isNaN(Number(value))) {
                        errors.push(`${fieldConfig.label} must be a number`);
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push(`${fieldConfig.label} must be true or false`);
                    }
                    break;
                case 'select':
                    if (fieldConfig.options && !fieldConfig.options.includes(value)) {
                        errors.push(`${fieldConfig.label} must be one of: ${fieldConfig.options.join(', ')}`);
                    }
                    break;
            }
        }
    }

    return errors;
};

module.exports = {
    categoryFields,
    categoryOptions,
    validateCustomFields
};