const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/seller.controller");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Upload verification documents (selfie + aadhar)
router.post(
    "/upload-documents",
    protect,
    authorize("seller"),
    upload.fields([
        { name: "selfie", maxCount: 1 },
        { name: "aadhar", maxCount: 1 },
    ]),
    sellerController.uploadDocuments
);

// Get seller profile
router.get("/profile", protect, authorize("seller"), sellerController.getProfile);

// Get all sellers (admin/company can view)
router.get("/all", protect, sellerController.getAllSellers);

module.exports = router;