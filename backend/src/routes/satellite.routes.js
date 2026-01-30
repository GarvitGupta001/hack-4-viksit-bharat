const express = require("express");
const router = express.Router();
const satelliteController = require("../controllers/satellite.controller");
const { protect, authorize } = require("../middlewares/auth");

// Verify property using satellite imagery (seller only)
router.post(
    "/verify-property",
    protect,
    authorize("seller"),
    satelliteController.verifyPropertyWithSatellite
);

// Get satellite verification result for a property
router.get(
    "/property/:propertyId",
    protect,
    satelliteController.getSatelliteVerificationResult
);

module.exports = router;