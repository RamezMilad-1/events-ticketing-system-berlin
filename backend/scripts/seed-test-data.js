// Seeds an admin user for QA. Idempotent — safe to run multiple times.
// Usage: node scripts/seed-test-data.js
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require(path.join(__dirname, '..', 'Model', 'UserSchema'));

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/EventBooking');

        const seeds = [
            { name: 'eventHub Admin', email: 'admin@eventhub.com', password: 'Admin@2026', role: 'System Admin' },
        ];

        for (const seed of seeds) {
            const existing = await User.findOne({ email: seed.email });
            if (existing) {
                console.log(`exists  ${seed.email} (${seed.role})  id=${existing._id}`);
            } else {
                const hash = await bcrypt.hash(seed.password, 10);
                const u = await User.create({
                    name: seed.name,
                    email: seed.email,
                    password: hash,
                    role: seed.role,
                });
                console.log(`created ${seed.email} (${seed.role})  id=${u._id}`);
            }
        }
    } catch (e) {
        console.error('seed failed:', e.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
})();
