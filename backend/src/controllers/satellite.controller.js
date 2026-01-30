const satelliteService = require("../services/satellite.service");

class SatelliteController {
    async verifyPropertyWithSatellite(req, res, next) {
        try {
            const { propertyId, coordinates } = req.body;

            if (!propertyId || !coordinates) {
                return res.status(400).json({
                    success: false,
                    message: "Property ID and coordinates are required",
                });
            }

            const result = await satelliteService.analyzePropertyWithSatellite(
                propertyId,
                coordinates,
                req.user._id
            );

            res.status(200).json({
                success: true,
                message: "Property satellite verification completed successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getSatelliteVerificationResult(req, res, next) {
        try {
            const result = await satelliteService.getSatelliteVerificationResult(
                req.params.propertyId,
                req.user._id
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SatelliteController();