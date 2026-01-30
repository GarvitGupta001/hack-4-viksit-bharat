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

        // Parse boundaryCoordinates properly - it might come as a string or as an object
        let parsedBoundaryCoordinates = boundaryCoordinates;
        if (typeof boundaryCoordinates === 'string') {
            try {
                parsedBoundaryCoordinates = JSON.parse(boundaryCoordinates);
            } catch (e) {
                console.error('Error parsing boundaryCoordinates:', e);
                parsedBoundaryCoordinates = [];
            }
        }

        // Ensure parsedBoundaryCoordinates is an array of {lat, lng} objects
        if (!Array.isArray(parsedBoundaryCoordinates)) {
            parsedBoundaryCoordinates = [];
        }

        // Create property
        const property = await Property.create({
            SellerId: sellerId,
            title,
            description,
            geotaggedImagesUrls,
            address,
            boundaryCoordinates: parsedBoundaryCoordinates,
            areaInSqFt,
        });

        // Initialize carbon coins to 0 initially, will be updated after satellite verification
        let coinsEarned = 0;

        // Update seller's carbon coin balance with initial 0
        let carbonCoin = await CarbonCoin.findOne({ ownerId: sellerId });
        if (!carbonCoin) {
            carbonCoin = await CarbonCoin.create({
                ownerId: sellerId,
                amount: 0,
                history: []
            });
        }

        // Trigger satellite verification in the background if boundary coordinates are provided
        if (property.boundaryCoordinates && property.boundaryCoordinates.length > 0) {
            try {
                // The satellite verification will award the actual carbon coins based on analysis
                // We'll return the property immediately and handle the satellite verification separately
                // Run satellite verification asynchronously to not block property creation
                setImmediate(async () => {
                    try {
                        // Format coordinates correctly for satellite service [lng, lat] for Shapely Polygon
                        const formattedCoordinates = property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]);

                        await satelliteService.analyzePropertyWithSatellite(
                            property._id,
                            formattedCoordinates,
                            sellerId
                        );
                    } catch (error) {
                        console.error("Satellite verification failed:", error.message);

                        // Update property with error status
                        try {
                            const updatedProperty = await Property.findById(property._id);
                            if (updatedProperty) {
                                updatedProperty.satelliteVerification = {
                                    status: "failed",
                                    error: error.message,
                                    analysisDate: new Date()
                                };
                                await updatedProperty.save();
                            }
                        } catch (dbError) {
                            console.error("Failed to update property with error status:", dbError);
                        }
                    }
                }); // Run asynchronously without blocking

                // For now, return the property with 0 coins, actual coins will be awarded after satellite verification
                coinsEarned = 0;
            } catch (error) {
                console.error("Error triggering satellite verification:", error);

                // Update property with error status
                property.satelliteVerification = {
                    status: "failed",
                    error: error.message,
                    analysisDate: new Date()
                };
                await property.save();
            }
        } else {
            // If no boundary coordinates provided, use simple calculation as fallback
            coinsEarned = Math.floor(areaInSqFt / 100);

            // Update seller's carbon coin balance
            carbonCoin.amount += coinsEarned;
            carbonCoin.history.push({
                date: new Date(),
                amount: coinsEarned,
                propertyId: property._id,
                reason: "initial_registration"
            });
            await carbonCoin.save();
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