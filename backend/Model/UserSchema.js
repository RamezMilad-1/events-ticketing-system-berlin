const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        profilePicture: { type: String, required: false, default: '' },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['Standard User', 'Organizer', 'System Admin'],
            required: true,
            default: 'Standard User',
        },

        // --- Forgot-password OTP fields ---
        passwordResetOtpHash: { type: String, default: null, select: false },
        passwordResetOtpExpiresAt: { type: Date, default: null, select: false },
        passwordResetAttempts: { type: Number, default: 0, select: false },
    },
    { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
