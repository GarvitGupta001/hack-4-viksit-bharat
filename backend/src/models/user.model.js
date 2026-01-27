const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ["seller", "company"],
        required: true,
    },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
