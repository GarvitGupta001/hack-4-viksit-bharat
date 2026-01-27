const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    logoUrl: {
        type: String,
    },
    registrationDocUrl: {
        type: String,
    },
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
