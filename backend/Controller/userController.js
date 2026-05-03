const userModel = require("../Model/UserSchema");
const jwt = require("jsonwebtoken");
const secretKey = "123456";
const bcrypt = require("bcrypt");
const Booking = require("../Model/BookingSchema");
const Event = require("../Model/EventSchema");

const userController = {
    register: async (req, res) => {
        try {
            const { name, email, profilePicture, password, role } = req.body;
            const existingUser = await userModel.findOne({ email });

            if (existingUser) {
                return res.status(409).json({ message: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);


            const newUser = new userModel({
                name,
                email,
                profilePicture,
                password: hashedPassword,
                role,
            });

            await newUser.save();

            res.status(201).json({ message: "User registered successfully" });
        } catch (error) {
            console.error("Error registering user:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find the user by email
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "email not found" });
            }

            console.log("password: ", user.password);
            // Check if the password is correct

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(405).json({ message: "incorect password" });
            }

            // Generate a JWT token
            const token = jwt.sign(
                { user: { userId: user._id, role: user.role } },
                secretKey,
                {
                    expiresIn: '1h', // Token expires in 1 hour
                }
            );

            // Return user without password
            const userWithoutPassword = user.toObject();
            delete userWithoutPassword.password;

            return res
                .cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    expires: undefined // Cookie will expire when browser closes
                })
                .status(200)
                .json({ message: "login successfully", success: true, user: userWithoutPassword });
        } catch (error) {
            console.error("Error logging in:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const users = await userModel.find();
            return res.status(200).json(users);
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    },

    //Update user password
    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.userId;

            // Validate input
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: "Old password and new password are required." });
            }

            // Find the user by ID
            const user = await userModel.findById(userId);

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // Compare old password with hashed password in DB
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Current password is incorrect." });
            }

            // Hash new password and update
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            res.status(200).json({ message: "Password updated successfully." });
        } catch (error) {
            console.error("Error in changePassword:", error);
            res.status(500).json({ message: "Something went wrong." });
        }
    },

    //Get current user's profile 
    getUserProfile: async (req, res) => {
        try {
            // Get user ID from req.user 
            const userId = req.user.userId;  // Changed from req.user.id to req.user.userId

            // Fetch the user from the DB (excluding password)
            const user = await userModel.findById(userId).select("-password");

            if (!user) {     // (if token is still available but user is deleted from db)
                return res.status(404).json({ message: "User not found." });
            }

            res.status(200).json({
                success: true,
                user,
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
            res.status(500).json({ message: "Server error." });
        }
    },



    //Update current user's profile 
    updateUserProfile: async (req, res) => {
        try {
            const userId = req.user.userId; // Changed from req.user.id to req.user.userId

            const { name, email, profilePicture } = req.body;

            // Find the user
            const user = await userModel.findById(userId);

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // Update fields if provided
            if (name) user.name = name;
            if (email) user.email = email;
            if (profilePicture) user.profilePicture = profilePicture;

            await user.save();

            // Return updated profile (excluding password)
            const updatedUser = await userModel.findById(userId).select("-password");

            res.status(200).json({
                success: true,
                message: "Profile updated successfully.",
                user: updatedUser
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Server error." });
        }
    },



    //Get details of a single user 
    getSingleUser: async (req, res) => {
        try {
            const userId = req.params.id;  // Extract the user ID from the URL path

            // Validate if the userId is provided
            if (!userId) {
                return res.status(400).json({ message: "User ID is required." });
            }

            const user = await userModel.findById(userId).select("-password");  // Find the user and exclude the password

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            res.status(200).json({
                success: true,
                user,
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Server error." });
        }
    },


    //Update user's role 
    updateUserRole: async (req, res) => {
        try {
            const userId = req.params.id;
            const { role } = req.body;

            // Validate role
            const validRoles = ["Standard User", "Organizer", "System Admin"];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: "Invalid role provided." });
            }

            const user = await userModel.findById(userId);

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            user.role = role;
            await user.save();

            res.status(200).json({
                success: true,
                message: "User role updated successfully.",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            });
        } catch (error) {
            console.error("Error updating user role:", error);
            res.status(500).json({ message: "Server error." });
        }
    },


    //Delete a user 
    deleteUser: async (req, res) => {
        try {
            // Extract the user ID from the URL
            const userId = req.params.id;

            // Validate if the user ID is provided
            if (!userId) {
                return res.status(400).json({ message: "User ID is required." });
            }

            // Check if the user exists before attempting to delete
            const user = await userModel.findById(userId);

            // If the user is not found, return a 404 error
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // If the user exists, proceed with deletion
            await userModel.findByIdAndDelete(userId);

            // Return a success message after deletion
            res.status(200).json({
                success: true,
                message: "User deleted successfully.",
            });
        } catch (error) {
            // Handle any errors that occur during the process
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Server error." });
        }
    },



    //Get current user's bookings 
    getCurrentBookings: async (req, res) => {
        try {
            console.log("here");
            const userId = req.user.userId;

            // Find the bookings related to the authenticated user and populate event details
            const bookings = await Booking.find({ user: userId }).populate('event');

            // If no bookings are found, send a message
            if (bookings.length === 0) {
                return res.status(404).json({ message: "No bookings found for this user." });
            }

            // Send the list of bookings
            res.status(200).json({
                success: true,
                bookings,
            });
        } catch (error) {
            console.error("Error fetching bookings:", error);
            res.status(500).json({ message: "Server error." });
        }
    },



    //Get current user's events 
    getMyEvents: async (req, res) => {
        try {
            const organizerId = req.user.userId;
            console.log("organizerId: ", organizerId);

            const events = await Event.find({ organizer: organizerId });

            if (events.length === 0) {
                return res.status(404).json({ message: "No events found." });
            }

            res.status(200).json({
                success: true,
                count: events.length,
                events,
            });
        } catch (error) {
            console.error("Error fetching organizer's events:", error);
            res.status(500).json({ message: "Server error." });
        }
    },



    //Get the analytics of the current user's events 
    getMyEventAnalytics: async (req, res) => {
        try {
            const organizerId = req.user.userId;

            // 1. Get all events created by this organizer
            const events = await Event.find({ organizer: organizerId });

            if (events.length === 0) {
                return res.status(404).json({ message: "No events found for this organizer." });
            }

            // 2. Extract event IDs
            const eventIds = events.map(event => event._id);

            // 3. Get bookings for these events
            const bookings = await Booking.find({ event: { $in: eventIds } });

            // 4. Calculate analytics
            const totalEvents = events.length;
            const totalTicketsSold = bookings.length;
            const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

            res.status(200).json({
                success: true,
                analytics: {
                    totalEvents,
                    totalTicketsSold,
                    totalRevenue,
                },
            });
        } catch (error) {
            console.error("Error getting event analytics:", error);
            res.status(500).json({ message: "Server error." });
        }
    },

    //Logout
    logout: async (req, res) => {
        try {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            res.status(200).json({ message: "Logout successfully", success: true });
        } catch (error) {
            console.error("Error logging out:", error);
            res.status(500).json({ message: "Server error" });
        }
    },

    //Delete own profile
    deleteOwnProfile: async (req, res) => {
        try {
            const userId = req.user.userId;

            // Find and delete the user
            const user = await userModel.findByIdAndDelete(userId);

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // Return success message
            res.status(200).json({
                success: true,
                message: "Profile deleted successfully.",
            });
        } catch (error) {
            console.error("Error deleting own profile:", error);
            res.status(500).json({ message: "Server error." });
        }
    }


};

module.exports = userController;