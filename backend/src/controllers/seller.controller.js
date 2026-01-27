const sellerService = require("../services/seller.service");

class SellerController {
    async uploadDocuments(req, res, next) {
        try {
            if (!req.files || (!req.files.selfie && !req.files.aadhar)) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload at least one document (selfie or aadhar)",
                });
            }

            const seller = await sellerService.uploadVerificationDocuments(
                req.user._id,
                req.files
            );

            res.status(200).json({
                success: true,
                message: "Documents uploaded successfully",
                data: seller,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const seller = await sellerService.getSellerProfile(req.user._id);
            res.status(200).json({
                success: true,
                data: seller,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllSellers(req, res, next) {
        try {
            const result = await sellerService.getAllSellers(req.query);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SellerController();