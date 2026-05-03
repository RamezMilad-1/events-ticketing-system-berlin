const mongoose = require("mongoose");

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profilePicture: { type: String, required: false, default: "" },
    password: { type: String, required: true },
    role: { type: String, enum: ["Standard User", "Organizer", "System Admin"], required: true },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;