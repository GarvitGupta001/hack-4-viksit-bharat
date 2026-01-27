const mongoose = require("mongoose");

const carbonCoinSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    history: {
        type: [
            {
                date: {
                    type: Date,
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                },
                propertyId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Property",
                },
            },
        ],
        required: true,
    },
});

const CarbonCoin = mongoose.model("CarbonCoin", carbonCoinSchema);

module.exports = CarbonCoin;
