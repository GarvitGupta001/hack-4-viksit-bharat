const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
    SellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    geotaggedImagesUrls: {
        type: [String],
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    boundaryCoordinates: {
        type: [{ lat: Number, lng: Number }],
        required: true,
    },
    areaInSqFt: {
        type: Number,
        required: true,
    },
    satelliteVerification: {
        status: {
            type: String,
            enum: ['not_started', 'queued', 'processing', 'verified', 'failed'],
            default: 'not_started'
        },
        results: {
            type: mongoose.Schema.Types.Mixed, // Store the full satellite analysis results
        },
        carbonCredits: {
            type: Number, // Amount of carbon credits awarded
        },
        error: {
            type: String, // Error message if verification failed
        },
        timestamp: {
            type: Date,
        }
    }
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;