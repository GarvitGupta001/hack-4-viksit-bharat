const express = require("express");
const router = express.Router();
const companyController = require("../controllers/company.controller");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Upload company documents (logo + registration doc)
router.post(
    "/upload-documents",
    protect,
    authorize("company"),
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "registrationDoc", maxCount: 1 },
    ]),
    companyController.uploadDocuments
);

// Get company profile
router.get("/profile", protect, authorize("company"), companyController.getProfile);

// Get all companies
router.get("/all", protect, companyController.getAllCompanies);

module.exports = router;