const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Seller = require("../models/seller.model");
const Company = require("../models/company.model");
const CarbonCoin = require("../models/carbonCoin.model");

class AuthService {
    async register(userData) {
        const { email, password, name, phone, address, type } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });
        if (existingUser) {
            throw new Error("User with this email or phone already exists");
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            type,
        });

        // Create type-specific profile
        if (type === "seller") {
            await Seller.create({ userId: user._id });
            // Initialize carbon coin balance for seller
            await CarbonCoin.create({
                ownerId: user._id,
                amount: 0,
                history: [],
            });
        } else if (type === "company") {
            await Company.create({ userId: user._id });
        }

        // Generate token
        const token = this.generateToken(user._id);

        return {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                type: user.type,
                verified: user.verified,
            },
        };
    }

    async login(email, password) {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        // Generate token
        const token = this.generateToken(user._id);

        return {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                type: user.type,
                verified: user.verified,
            },
        };
    }

    async getProfile(userId) {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            throw new Error("User not found");
        }

        let profile = { ...user.toObject() };

        if (user.type === "seller") {
            const sellerProfile = await Seller.findOne({ userId: user._id });
            const carbonCoins = await CarbonCoin.findOne({ ownerId: user._id });
            profile.sellerProfile = sellerProfile;
            profile.carbonCoins = carbonCoins?.amount || 0;
        } else if (user.type === "company") {
            const companyProfile = await Company.findOne({ userId: user._id });
            profile.companyProfile = companyProfile;
        }

        return profile;
    }

    async updateProfile(userId, updateData) {
        const { name, phone, address } = updateData;

        const user = await User.findByIdAndUpdate(
            userId,
            { name, phone, address },
            { new: true, runValidators: true },
        ).select("-password");

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    generateToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
    }
}

module.exports = new AuthService();
