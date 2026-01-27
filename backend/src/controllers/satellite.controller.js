const satelliteService = require("../services/satellite.service");

class SatelliteController {
    async triggerSatelliteVerification(req, res, next) {
        try {
            const { propertyId } = req.body;
            
            if (!propertyId) {
                return res.status(400).json({
                    success: false,
                    message: "Property ID is required"
                });
            }

            const result = await satelliteService.initiateSatelliteVerification(
                propertyId,
                req.user._id
            );

            res.status(200).json({
                success: true,
                message: "Satellite verification initiated successfully",
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getVerificationStatus(req, res, next) {
        try {
            const { propertyId } = req.params;

            const status = await satelliteService.getVerificationStatus(propertyId);

            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SatelliteController();