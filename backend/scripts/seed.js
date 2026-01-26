const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/user.model");
const Seller = require("../models/seller.model");
const Company = require("../models/company.model");
const Property = require("../models/property.model");
const CarbonCoin = require("../models/carbonCoin.model");

const seedData = async () => {
    await connectDB();

    console.log("Clearing old data...");
    await User.deleteMany();
    await Seller.deleteMany();
    await Company.deleteMany();
    await Property.deleteMany();
    await CarbonCoin.deleteMany();

    // ------------------- USERS -------------------
    console.log("Creating users...");

    const sellerUser = await User.create({
        email: "farmer1@example.com",
        password: "hashedpassword123",
        name: "Ramesh Patel",
        phone: "9876543210",
        address: "Gujarat, India",
        verified: true,
        type: "seller",
    });

    const sellerUser2 = await User.create({
        email: "farmer2@example.com",
        password: "hashedpassword123",
        name: "Suresh Kumar",
        phone: "9876543211",
        address: "Punjab, India",
        verified: true,
        type: "seller",
    });

    const companyUser = await User.create({
        email: "greenenergy@corp.com",
        password: "hashedpassword123",
        name: "Green Energy Pvt Ltd",
        phone: "9123456780",
        address: "Bangalore, India",
        verified: true,
        type: "company",
    });

    // ------------------- SELLER PROFILES -------------------
    console.log("Creating sellers...");

    await Seller.create({
        userId: sellerUser._id,
        selfieUrl: "https://example.com/selfie1.jpg",
        aadharUrl: "https://example.com/aadhar1.jpg",
    });

    await Seller.create({
        userId: sellerUser2._id,
        selfieUrl: "https://example.com/selfie2.jpg",
        aadharUrl: "https://example.com/aadhar2.jpg",
    });

    // ------------------- COMPANY PROFILE -------------------
    console.log("Creating company...");

    await Company.create({
        userId: companyUser._id,
        logoUrl: "https://example.com/companylogo.png",
        registrationDocUrl: "https://example.com/registration.pdf",
    });

    // ------------------- PROPERTIES (Tree Plantation Land) -------------------
    console.log("Creating properties...");

    const property1 = await Property.create({
        SellerId: sellerUser._id,
        title: "500 Mango Trees Farm",
        description: "Sustainable mango plantation reducing CO2",
        geotaggedImagesUrls: [
            "https://example.com/farm1.jpg",
            "https://example.com/farm2.jpg",
        ],
        address: "Anand, Gujarat",
        boundaryCoordinates: [
            { lat: 22.5645, lng: 72.9289 },
            { lat: 22.5648, lng: 72.9295 },
        ],
        areaInSqFt: 20000,
    });

    const property2 = await Property.create({
        SellerId: sellerUser2._id,
        title: "Bamboo Plantation",
        description: "Fast-growing bamboo absorbing carbon",
        geotaggedImagesUrls: [
            "https://example.com/bamboo1.jpg",
            "https://example.com/bamboo2.jpg",
        ],
        address: "Ludhiana, Punjab",
        boundaryCoordinates: [
            { lat: 30.9000, lng: 75.8573 },
            { lat: 30.9010, lng: 75.8580 },
        ],
        areaInSqFt: 15000,
    });

    // ------------------- CARBON WALLETS -------------------
    console.log("Creating carbon wallets...");

    await CarbonCoin.create({
        ownerId: sellerUser._id,
        amount: 120, // total carbon credits
        history: [
            {
                date: new Date(),
                amount: 80,
                propertyId: property1._id,
            },
            {
                date: new Date(),
                amount: 40,
                propertyId: property1._id,
            },
        ],
    });

    await CarbonCoin.create({
        ownerId: sellerUser2._id,
        amount: 75,
        history: [
            {
                date: new Date(),
                amount: 75,
                propertyId: property2._id,
            },
        ],
    });

    console.log("🌱 Seeding completed successfully!");
    process.exit();
};

seedData();
