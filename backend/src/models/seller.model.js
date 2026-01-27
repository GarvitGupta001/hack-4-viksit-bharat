const mongoose = require("mongoose");

const sellerModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    selfieUrl: {
        type: String,
    },
    aadharUrl: {
        type: String,
    },
});

const Seller = mongoose.model("Seller", sellerModel);

module.exports = Seller;
