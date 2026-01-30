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
    // Satellite verification data
    satelliteVerification: {
        status: {
            type: String,
            enum: ["pending", "verified", "failed"],
            default: "pending"
        },
        analysisDate: {
            type: Date
        },
        totalAreaHa: {
            type: Number
        },
        carbonCreditsYear: {
            type: Number
        },
        greenPointsYear: {
            type: Number
        },
        breakdown: [{
            type: {
                type: String
            },
            area_ha: {
                type: Number
            },
            credits: {
                type: Number
            },
            percent: {
                type: Number
            }
        }],
        images: {
            satellite: String,
            analysis: String
        },
        meta: {
            image_date: String,
            processing_time: Number
        },
        error: String
    }
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;