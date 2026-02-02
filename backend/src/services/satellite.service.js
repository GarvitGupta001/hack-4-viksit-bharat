const axios = require("axios");
const Property = require("../models/property.model");
const CarbonCoin = require("../models/carbonCoin.model");
const User = require("../models/user.model");

class SatelliteService {
    /**
     * Analyze property using satellite imagery and calculate carbon credits
     */
    async analyzePropertyWithSatellite(propertyId, coordinates, userId) {
        try {
            // Verify that the user owns the property
            const property = await Property.findById(propertyId);
            if (!property) {
                throw new Error("Property not found");
            }
            
            if (property.SellerId.toString() !== userId.toString()) {
                throw new Error("Unauthorized: You don't own this property");
            }

            // Validate coordinates format before calling satellite service
            if (!Array.isArray(coordinates) || coordinates.length === 0) {
                throw new Error("Invalid coordinates: must be a non-empty array of coordinate pairs");
            }

            // Debug: log incoming coordinates
            console.log("Incoming coordinates to satellite service:", coordinates);

            // Ensure coordinates are in the correct format [[lon, lat], [lon, lat], ...] for Shapely Polygon
            // The satellite service expects [longitude, latitude] format
            const formattedCoordinates = coordinates.map(coord => {
                // If coord is already an array with 2 elements, determine if it's [lng, lat] or [lat, lng] format
                if (Array.isArray(coord) && coord.length === 2) {
                    const first = Number(coord[0]);
                    const second = Number(coord[1]);

                    // Determine if it's [lng, lat] or [lat, lng] format based on value ranges
                    const firstIsLng = Math.abs(first) > 90; // If first value is outside latitude range, it's likely longitude
                    const secondIsLatCheck = Math.abs(second) <= 90; // If second value is within latitude range

                    if (firstIsLng && secondIsLatCheck) {
                        // This is [lng, lat] format - use as is
                        return [first, second]; // [longitude, latitude] for Shapely
                    }
                    // If first is within latitude range and second is outside latitude range, it's [lat, lng] format
                    else if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                        // This is [lat, lng] format - swap to [lng, lat]
                        return [second, first]; // [longitude, latitude] for Shapely
                    }
                    // Special case: both values are within latitude range (both <= 90)
                    // Use the fact that longitude values are typically larger in magnitude in many regions
                    else if (Math.abs(first) <= 90 && Math.abs(second) <= 90) {
                        // If first is smaller than second, it's more likely to be latitude (typically smaller values)
                        if (Math.abs(first) < Math.abs(second)) {
                            // Likely [lat, lng] - swap to [lng, lat]
                            return [second, first]; // [longitude, latitude] for Shapely
                        } else {
                            // Likely [lng, lat] - use as is
                            return [first, second]; // [longitude, latitude] for Shapely
                        }
                    }
                    else {
                        // If we can't determine the format clearly, throw an error
                        throw new Error(`Ambiguous coordinate values: [${first}, ${second}]. Unable to determine if format is [lat, lng] or [lng, lat].`);
                    }
                }

                // If coord is an object with lat/lng properties, convert to [lng, lat] array (for Shapely Polygon)
                if (typeof coord === 'object' && coord !== null && coord.lat !== undefined && coord.lng !== undefined) {
                    const lng = Number(coord.lng);
                    const lat = Number(coord.lat);

                    // Basic validation to ensure values are in reasonable ranges
                    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                        throw new Error(`Invalid coordinate values: [${lng}, ${lat}]. Latitude must be between -90 and 90, longitude between -180 and 180.`);
                    }

                    return [lng, lat]; // [longitude, latitude] for Shapely
                }

                // If coord is an object with lat/lon properties (alternative format), convert to [lon, lat]
                if (typeof coord === 'object' && coord !== null && coord.lat !== undefined && coord.lon !== undefined) {
                    const lon = Number(coord.lon);
                    const lat = Number(coord.lat);

                    // Basic validation to ensure values are in reasonable ranges
                    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                        throw new Error(`Invalid coordinate values: [${lon}, ${lat}]. Latitude must be between -90 and 90, longitude between -180 and 180.`);
                    }

                    return [lon, lat]; // [longitude, latitude] for Shapely
                }

                throw new Error(`Invalid coordinate format: ${JSON.stringify(coord)}. Expected [lng, lat] array, {lat, lng} object, or {lat, lon} object.`);
            });

            // Get the base satellite service URL
            let satelliteServiceBaseUrl = process.env.SATELLITE_SERVICE_URL || "http://127.0.0.1:8000";
            // Ensure the URL has the protocol
            if (!satelliteServiceBaseUrl.startsWith('http')) {
                satelliteServiceBaseUrl = `http://${satelliteServiceBaseUrl}`;
            }
            // Ensure the base URL doesn't end with a slash
            if (satelliteServiceBaseUrl.endsWith('/')) {
                satelliteServiceBaseUrl = satelliteServiceBaseUrl.slice(0, -1);
            }

            // Hardcode the health check URL
            const healthUrl = `${satelliteServiceBaseUrl}/health`;

            // First, check if the satellite service is reachable using the health endpoint
            try {
                await axios.get(healthUrl, { timeout: 5000 });
            } catch (healthCheckError) {
                console.error(`Satellite service health check failed at ${healthUrl}. Please ensure the satellite service is running on port 8000.`);
                throw new Error(`Satellite service is not reachable at ${healthUrl}. Please ensure the satellite service is running on port 8000.`);
            }

            // Hardcode the analysis URL
            const analysisUrl = `${satelliteServiceBaseUrl}/api/analyze`;

            let response;
            try {
                // Now that we know the service is running, call the analysis endpoint
                response = await axios.post(analysisUrl, {
                    coordinates: formattedCoordinates
                }, {
                    timeout: 60000 // Increase timeout to 60 seconds for satellite processing
                });
            } catch (error) {
                // If the request fails, log detailed error information
                console.error(`Satellite analysis failed with status: ${error.response?.status}`);
                console.error(`Error details: ${error.response?.data || error.message}`);
                console.error(`Request URL: ${analysisUrl}`);
                console.error(`Request payload:`, formattedCoordinates);

                // Throw a more descriptive error
                const errorMessage = error.response?.data?.message || error.response?.data || error.message;
                throw new Error(`Satellite analysis failed with status ${error.response?.status}: ${errorMessage}`);
            }

            if (response.data.status !== "success") {
                throw new Error(`Satellite analysis failed: ${response.data.message}`);
            }

            const analysisResult = response.data.data;

            // Update property with satellite verification data
            property.satelliteVerification = {
                status: "verified",
                analysisDate: new Date(),
                totalAreaHa: analysisResult.summary.total_area_ha,
                carbonCreditsYear: analysisResult.summary.carbon_credits_year,
                greenPointsYear: analysisResult.summary.green_points_year,
                breakdown: analysisResult.breakdown,
                images: {
                    satellite: analysisResult.images.satellite,
                    analysis: analysisResult.images.analysis
                },
                meta: analysisResult.meta
            };

            await property.save();

            // Use green points from satellite analysis as carbon coins
            // The satellite service calculates green_points_year = carbon_credits_year * 1000
            const greenPoints = analysisResult.summary.green_points_year;

            // Award carbon coins to the property owner based on green points
            await this.awardCarbonCoins(userId, greenPoints, propertyId, "satellite_verification");

            return {
                propertyId: property._id,
                analysisResult: analysisResult,
                carbonCoinsAwarded: greenPoints
            };
        } catch (error) {
            console.error("Satellite analysis error:", error);
            // Update property with error status
            const property = await Property.findById(propertyId);
            if (property) {
                property.satelliteVerification = {
                    status: "failed",
                    error: error.message,
                    analysisDate: new Date()
                };
                await property.save();
            }
            throw error;
        }
    }

    /**
     * Get satellite verification result for a property
     */
    async getSatelliteVerificationResult(propertyId, userId) {
        const property = await Property.findById(propertyId);
        
        if (!property) {
            throw new Error("Property not found");
        }
        
        if (property.SellerId.toString() !== userId.toString()) {
            throw new Error("Unauthorized: You don't own this property");
        }

        if (!property.satelliteVerification) {
            throw new Error("Satellite verification not performed for this property");
        }

        return property.satelliteVerification;
    }

    /**
     * Award carbon coins to a user
     */
    async awardCarbonCoins(userId, amount, propertyId, reason) {
        let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });

        if (!carbonCoinRecord) {
            // Create new carbon coin record if it doesn't exist
            carbonCoinRecord = new CarbonCoin({
                ownerId: userId,
                amount: amount,
                history: [{
                    date: new Date(),
                    amount: amount,
                    propertyId: propertyId,
                    reason: reason
                }]
            });
        } else {
            // Update the amount
            carbonCoinRecord.amount += amount;

            // Add to history
            carbonCoinRecord.history.push({
                date: new Date(),
                amount: amount,
                propertyId: propertyId,
                reason: reason
            });
        }

        await carbonCoinRecord.save();

        return carbonCoinRecord;
    }
}

module.exports = new SatelliteService();