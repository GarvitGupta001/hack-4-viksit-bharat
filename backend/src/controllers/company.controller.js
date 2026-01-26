const companyService = require("../services/company.service");

class CompanyController {
    async uploadDocuments(req, res, next) {
        try {
            if (!req.files || (!req.files.logo && !req.files.registrationDoc)) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload at least one document (logo or registration doc)",
                });
            }

            const company = await companyService.uploadCompanyDocuments(
                req.user._id,
                req.files
            );

            res.status(200).json({
                success: true,
                message: "Documents uploaded successfully",
                data: company,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const company = await companyService.getCompanyProfile(req.user._id);
            res.status(200).json({
                success: true,
                data: company,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllCompanies(req, res, next) {
        try {
            const result = await companyService.getAllCompanies(req.query);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CompanyController();