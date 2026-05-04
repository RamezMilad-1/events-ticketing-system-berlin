const mongoose = require('mongoose');

const OutletSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        city: { type: String, default: 'Berlin', trim: true },
        country: { type: String, default: 'Germany', trim: true },
        phone: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true, lowercase: true },
        workingHours: { type: String, default: '', trim: true },
        paymentMethods: { type: [String], default: ['cash', 'visa', 'mastercard'] },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        image: { type: String, default: '' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

OutletSchema.index({ city: 1, active: 1 });

module.exports = mongoose.model('Outlet', OutletSchema);
