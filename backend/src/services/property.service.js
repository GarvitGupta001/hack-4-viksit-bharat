const Property = require("../models/property.model");
const CarbonCoin = require("../models/carbonCoin.model");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const satelliteService = require("./satellite.service");

class PropertyService {
    async createProperty(sellerId, propertyData, images) {
        const { title, description, address, boundaryCoordinates, areaInSqFt } = propertyData;

        // Upload images to cloudinary
        const imageUploadPromises = images.map((image) =>
            uploadToCloudinary(image.buffer, "carbon_marketplace/properties")
        );
        const uploadedImages = await Promise.all(imageUploadPromises);
        const geotaggedImagesUrls = uploadedImages.map((img) => img.secure_url);

        // Create property
        const property = await Property.create({
            SellerId: sellerId,
            title,
            description,
            geotaggedImagesUrls,
            address,
            boundaryCoordinates: JSON.parse(boundaryCoordinates),
            areaInSqFt,
        });

        // Calculate carbon coins based on area (example: 1 coin per 100 sqft)
        let coinsEarned = Math.floor(areaInSqFt / 100);

        // Update seller's carbon coin balance
        const carbonCoin = await CarbonCoin.findOne({ ownerId: sellerId });
        if (carbonCoin) {
            carbonCoin.amount += coinsEarned;
            carbonCoin.history.push({
                date: new Date(),
                amount: coinsEarned,
                propertyId: property._id,
            });
            await carbonCoin.save();
        }

        // Trigger satellite verification if boundary coordinates are provided
        if (boundaryCoordinates && Array.isArray(JSON.parse(boundaryCoordinates)) && JSON.parse(boundaryCoordinates).length >= 3) {
            try {
                await satelliteService.initiateSatelliteVerification(property._id, sellerId);
                console.log(`Satellite verification triggered for property ${property._id}`);
            } catch (satelliteError) {
                console.error(`Failed to trigger satellite verification for property ${property._id}:`, satelliteError.message);
                // Don't fail the property creation if satellite verification fails
            }
        }

        return { property, coinsEarned };
    }

    async getPropertyById(propertyId) {
        const property = await Property.findById(propertyId).populate(
            "SellerId",
            "name email phone"
        );
        if (!property) {
            throw new Error("Property not found");
        }
        return property;
    }

    async getAllProperties(query) {
        const { page = 1, limit = 10, sellerId } = query;

        const filter = {};
        if (sellerId) {
            filter.SellerId = sellerId;
        }

        const properties = await Property.find(filter)
            .populate("SellerId", "name email phone")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Property.countDocuments(filter);

        return {
            properties,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        };
    }

    async updateProperty(propertyId, sellerId, updateData) {
        const property = await Property.findOne({ _id: propertyId, SellerId: sellerId });
        if (!property) {
            throw new Error("Property not found or you don't have permission to update it");
        }

        Object.assign(property, updateData);
        await property.save();

        return property;
    }

    async deleteProperty(propertyId, sellerId) {
        const property = await Property.findOne({ _id: propertyId, SellerId: sellerId });
        if (!property) {
            throw new Error("Property not found or you don't have permission to delete it");
        }

        await property.deleteOne();
        return { message: "Property deleted successfully" };
    }

    async getSellerProperties(sellerId) {
        const properties = await Property.find({ SellerId: sellerId }).sort({ createdAt: -1 });
        return properties;
    }
}

module.exports = new PropertyService();