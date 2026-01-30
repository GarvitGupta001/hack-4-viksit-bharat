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
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;