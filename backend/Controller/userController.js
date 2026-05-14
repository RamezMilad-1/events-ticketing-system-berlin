const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userModel = require('../Model/UserSchema');
const Booking = require('../Model/BookingSchema');
const Event = require('../Model/EventSchema');
const { sendOtpEmail } = require('../utils/email');

const JWT_SECRET = () => {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
    }
    return 'unsafe-dev-fallback';
};
const OTP_TTL_MIN = () => Number(process.env.OTP_TTL_MINUTES) || 10;
const OTP_MAX_ATTEMPTS = () => Number(process.env.OTP_MAX_ATTEMPTS) || 5;

const VALID_ROLES = ['Standard User', 'Organizer', 'System Admin'];
const PUBLIC_ROLES = ['Standard User', 'Organizer']; // roles allowed at registration

const COOKIE_OPTIONS = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',    path: '/',
});

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateNumericOtp() {
    // 6-digit zero-padded
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

const userController = {
    // -----------------------------------------------------------------
    // Auth: register, login, logout
    // -----------------------------------------------------------------
    register: async (req, res) => {
        try {
            const { name, email, profilePicture, password, role } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            }
            if (!isValidEmail(email)) {
                return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
            }
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
            }
            const requestedRole = role || 'Standard User';
            // Prevent self-elevation to admin via registration
            if (!PUBLIC_ROLES.includes(requestedRole)) {
                return res.status(400).json({ success: false, message: 'Invalid role for self-registration.' });
            }

            const existingUser = await userModel.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await userModel.create({
                name,
                email: email.toLowerCase(),
                profilePicture: profilePicture || '',
                password: hashedPassword,
                role: requestedRole,
            });

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
            });
        } catch (error) {
            console.error('Error registering user:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required.' });
            }

            const user = await userModel.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { user: { userId: user._id, role: user.role } },
                JWT_SECRET(),
                { expiresIn: '7d' }
            );

            const userWithoutPassword = user.toObject();
            delete userWithoutPassword.password;
            delete userWithoutPassword.passwordResetOtpHash;
            delete userWithoutPassword.passwordResetOtpExpiresAt;
            delete userWithoutPassword.passwordResetAttempts;

            return res
                .cookie('token', token, { ...COOKIE_OPTIONS(), maxAge: 7 * 24 * 60 * 60 * 1000 })
                .status(200)
                .json({ success: true, message: 'Login successful', user: userWithoutPassword, token });
        } catch (error) {
            console.error('Error logging in:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('token', COOKIE_OPTIONS());
            return res.status(200).json({ success: true, message: 'Logout successful' });
        } catch (error) {
            console.error('Error logging out:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // -----------------------------------------------------------------
    // Forgot password — OTP via email (3-step or single-call)
    // -----------------------------------------------------------------

    /** POST /forgetPassword/request — body: { email } */
    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;
            if (!isValidEmail(email)) {
                return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
            }

            const user = await userModel
                .findOne({ email: email.toLowerCase() })
                .select('+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts');

            // Respond identically whether the user exists, to prevent email enumeration
            if (user) {
                const otp = generateNumericOtp();
                user.passwordResetOtpHash = hashOtp(otp);
                user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MIN() * 60 * 1000);
                user.passwordResetAttempts = 0;
                await user.save();

                try {
                    await sendOtpEmail(user.email, otp);
                } catch (mailErr) {
                    console.error('[email] failed to send OTP:', mailErr.message);
                    // Still respond OK — caller can re-request
                }
            }

            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a one-time code has been sent.',
            });
        } catch (error) {
            console.error('requestPasswordReset error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    /** POST /forgetPassword/verify — body: { email, otp } → { resetToken } */
    verifyPasswordResetOtp: async (req, res) => {
        try {
            const { email, otp } = req.body;
            if (!isValidEmail(email) || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
            }

            const user = await userModel
                .findOne({ email: email.toLowerCase() })
                .select('+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts');

            if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
                return res.status(400).json({ success: false, message: 'No active OTP. Please request a new code.' });
            }
            if (user.passwordResetOtpExpiresAt < new Date()) {
                return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
            }
            if (user.passwordResetAttempts >= OTP_MAX_ATTEMPTS()) {
                return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
            }

            if (hashOtp(otp) !== user.passwordResetOtpHash) {
                user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
                await user.save();
                return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
            }

            const resetToken = jwt.sign(
                { purpose: 'pwreset', userId: user._id },
                JWT_SECRET(),
                { expiresIn: '15m' }
            );

            return res.status(200).json({ success: true, message: 'OTP verified', resetToken });
        } catch (error) {
            console.error('verifyPasswordResetOtp error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    /**
     * PUT /forgetPassword — body either:
     *   { email, otp, newPassword }                  (single-call form, spec-compatible)
     *   { resetToken, newPassword }                  (after /verify)
     */
    resetPassword: async (req, res) => {
        try {
            const { email, otp, resetToken, newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
            }

            let userId = null;

            if (resetToken) {
                try {
                    const decoded = jwt.verify(resetToken, JWT_SECRET());
                    if (decoded?.purpose !== 'pwreset') {
                        return res.status(400).json({ success: false, message: 'Invalid reset token.' });
                    }
                    userId = decoded.userId;
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
                }
            } else {
                if (!isValidEmail(email) || !otp) {
                    return res.status(400).json({
                        success: false,
                        message: 'Provide either {email, otp, newPassword} or {resetToken, newPassword}.',
                    });
                }
                const user = await userModel
                    .findOne({ email: email.toLowerCase() })
                    .select('+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts');
                if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
                    return res.status(400).json({ success: false, message: 'No active OTP. Please request a new code.' });
                }
                if (user.passwordResetOtpExpiresAt < new Date()) {
                    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
                }
                if (user.passwordResetAttempts >= OTP_MAX_ATTEMPTS()) {
                    return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
                }
                if (hashOtp(otp) !== user.passwordResetOtpHash) {
                    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
                    await user.save();
                    return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
                }
                userId = user._id;
            }

            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            user.passwordResetOtpHash = null;
            user.passwordResetOtpExpiresAt = null;
            user.passwordResetAttempts = 0;
            await user.save();

            return res.status(200).json({ success: true, message: 'Password updated successfully.' });
        } catch (error) {
            console.error('resetPassword error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // -----------------------------------------------------------------
    // Profile & user management
    // -----------------------------------------------------------------

    getAllUsers: async (req, res) => {
        try {
            const users = await userModel.find().select('-password');
            return res.status(200).json({ success: true, users });
        } catch (e) {
            console.error('Error listing users:', e);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    /** Authenticated user changes own password (knows old password). */
    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.userId;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Old password and new password are required.' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
            }

            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            return res.status(200).json({ success: true, message: 'Password updated successfully.' });
        } catch (error) {
            console.error('Error in changePassword:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    getUserProfile: async (req, res) => {
        try {
            const user = await userModel.findById(req.user.userId).select('-password');
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            return res.status(200).json({ success: true, user });
        } catch (error) {
            console.error('Error fetching profile:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    updateUserProfile: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { name, email, profilePicture } = req.body;

            const updates = {};
            if (typeof name === 'string' && name.trim()) updates.name = name.trim();
            if (typeof email === 'string' && email.trim()) {
                if (!isValidEmail(email)) {
                    return res.status(400).json({ success: false, message: 'Invalid email format.' });
                }
                updates.email = email.toLowerCase();
            }
            if (typeof profilePicture === 'string') updates.profilePicture = profilePicture;

            // Check for email collision
            if (updates.email) {
                const taken = await userModel.findOne({ email: updates.email, _id: { $ne: userId } });
                if (taken) {
                    return res.status(409).json({ success: false, message: 'That email is already in use.' });
                }
            }

            const updatedUser = await userModel
                .findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
                .select('-password');

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully.',
                user: updatedUser,
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    getSingleUser: async (req, res) => {
        try {
            const user = await userModel.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            return res.status(200).json({ success: true, user });
        } catch (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    updateUserRole: async (req, res) => {
        try {
            const { role } = req.body;
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role provided.' });
            }

            const user = await userModel.findByIdAndUpdate(
                req.params.id,
                { role },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            return res.status(200).json({
                success: true,
                message: 'User role updated successfully.',
                user,
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const user = await userModel.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            return res.status(200).json({ success: true, message: 'User deleted successfully.' });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    deleteOwnProfile: async (req, res) => {
        try {
            const user = await userModel.findByIdAndDelete(req.user.userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            res.clearCookie('token', COOKIE_OPTIONS());
            return res.status(200).json({ success: true, message: 'Profile deleted successfully.' });
        } catch (error) {
            console.error('Error deleting own profile:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // -----------------------------------------------------------------
    // Standard user: my bookings
    // -----------------------------------------------------------------
    getCurrentBookings: async (req, res) => {
        try {
            const bookings = await Booking.find({ user: req.user.userId })
                .populate('event')
                .sort({ createdAt: -1 });
            return res.status(200).json({ success: true, bookings });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // -----------------------------------------------------------------
    // Organizer: my events + analytics
    // -----------------------------------------------------------------
    getMyEvents: async (req, res) => {
        try {
            const events = await Event.find({ organizer: req.user.userId }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, count: events.length, events });
        } catch (error) {
            console.error("Error fetching organizer's events:", error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    getMyEventAnalytics: async (req, res) => {
        try {
            const organizerId = req.user.userId;
            const events = await Event.find({ organizer: organizerId });

            // Per-event breakdown for the chart, plus aggregate totals for the stat cards.
            const perEvent = events.map((event) => {
                const total = event.totalTickets || 0;
                const remaining = event.remainingTickets || 0;
                const sold = Math.max(0, total - remaining);
                const price = event.ticketPrice || 0;
                const revenue = sold * price;
                const percentageBooked = total > 0 ? Number(((sold / total) * 100).toFixed(2)) : 0;

                return {
                    _id: event._id,
                    title: event.title,
                    status: event.status,
                    totalTickets: total,
                    remainingTickets: remaining,
                    ticketsSold: sold,
                    ticketPrice: price,
                    revenue,
                    percentageBooked,
                };
            });

            const totals = perEvent.reduce(
                (acc, e) => ({
                    events: acc.events + 1,
                    totalTickets: acc.totalTickets + e.totalTickets,
                    ticketsSold: acc.ticketsSold + e.ticketsSold,
                    revenue: acc.revenue + e.revenue,
                }),
                { events: 0, totalTickets: 0, ticketsSold: 0, revenue: 0 }
            );

            return res.status(200).json({ success: true, events: perEvent, totals });
        } catch (error) {
            console.error('Error getting event analytics:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    },
};

module.exports = userController;
