const Seller = require("../models/seller.model");
const User = require("../models/user.model");
const SellerVerificationQueue = require("../queues/sellerVerificationQueue");
const { uploadToCloudinary } = require("../../utils/cloudinary");

class SellerService {
    async uploadVerificationDocuments(userId, files) {
        const seller = await Seller.findOne({ userId });
        if (!seller) {
            throw new Error("Seller profile not found");
        }

        let selfieUrl = seller.selfieUrl;
        let aadharUrl = seller.aadharUrl;

        if (files.selfie) {
            const selfieResult = await uploadToCloudinary(
                files.selfie[0].buffer,
                "carbon_marketplace/seller/selfies",
            );
            selfieUrl = selfieResult.secure_url;
        }

        if (files.aadhar) {
            const aadharResult = await uploadToCloudinary(
                files.aadhar[0].buffer,
                "carbon_marketplace/seller/aadhar",
            );
            aadharUrl = aadharResult.secure_url;
        }
        
        seller.selfieUrl = selfieUrl;
        seller.aadharUrl = aadharUrl;
        await seller.save();
        await SellerVerificationQueue.addJob({ userId });

        return seller;
    }

    async getSellerProfile(userId) {
        const seller = await Seller.findOne({ userId }).populate(
            "userId",
            "-password",
        );
        if (!seller) {
            throw new Error("Seller profile not found");
        }
        return seller;
    }

    async getAllSellers(query) {
        const { page = 1, limit = 10, verified } = query;

        const filter = { type: "seller" };
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
            sellers: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        };
    }
}

module.exports = new SellerService();
