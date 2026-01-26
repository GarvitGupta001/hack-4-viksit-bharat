const Company = require("../models/company.model");
const User = require("../models/user.model");
const { uploadToCloudinary } = require("../../utils/cloudinary");

class CompanyService {
    async uploadCompanyDocuments(userId, files) {
        const company = await Company.findOne({ userId });
        if (!company) {
            throw new Error("Company profile not found");
        }

        let logoUrl = company.logoUrl;
        let registrationDocUrl = company.registrationDocUrl;

        if (files.logo) {
            const logoResult = await uploadToCloudinary(
                files.logo[0].buffer,
                "carbon_marketplace/company/logos"
            );
            logoUrl = logoResult.secure_url;
        }

        if (files.registrationDoc) {
            const docResult = await uploadToCloudinary(
                files.registrationDoc[0].buffer,
                "carbon_marketplace/company/documents"
            );
            registrationDocUrl = docResult.secure_url;
        }

        company.logoUrl = logoUrl;
        company.registrationDocUrl = registrationDocUrl;
        await company.save();

        // Update user verification status
        await User.findByIdAndUpdate(userId, { verified: true });

        return company;
    }

    async getCompanyProfile(userId) {
        const company = await Company.findOne({ userId }).populate("userId", "-password");
        if (!company) {
            throw new Error("Company profile not found");
        }
        return company;
    }

    async getAllCompanies(query) {
        const { page = 1, limit = 10, verified } = query;

        const filter = { type: "company" };
        if (verified !== undefined) {
            filter.verified = verified === "true";
        }

        const users = await User.find(filter)
            .select("-password")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        return {
            companies: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        };
    }
}

module.exports = new CompanyService();