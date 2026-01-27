const propertyService = require("../services/property.service");

class PropertyController {
    async createProperty(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload at least one geotagged image",
                });
            }

            const result = await propertyService.createProperty(
                req.user._id,
                req.body,
                req.files
            );

            res.status(201).json({
                success: true,
                message: `Property created successfully. You earned ${result.coinsEarned} carbon coins!`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProperty(req, res, next) {
        try {
            const property = await propertyService.getPropertyById(req.params.id);
            res.status(200).json({
                success: true,
                data: property,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllProperties(req, res, next) {
        try {
            const result = await propertyService.getAllProperties(req.query);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProperty(req, res, next) {
        try {
            const property = await propertyService.updateProperty(
                req.params.id,
                req.user._id,
                req.body
            );

            res.status(200).json({
                success: true,
                message: "Property updated successfully",
                data: property,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProperty(req, res, next) {
        try {
            const result = await propertyService.deleteProperty(req.params.id, req.user._id);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyProperties(req, res, next) {
        try {
            const properties = await propertyService.getSellerProperties(req.user._id);
            res.status(200).json({
                success: true,
                data: properties,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PropertyController();