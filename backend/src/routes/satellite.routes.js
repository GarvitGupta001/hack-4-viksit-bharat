const express = require("express");
const router = express.Router();
const satelliteController = require("../controllers/satellite.controller");
const { protect, authorize } = require("../middlewares/auth");

// Trigger satellite verification for a property
router.post(
    "/verify-property",
    protect,
    authorize("seller"),
    satelliteController.triggerSatelliteVerification
);

// Get satellite verification status for a property
router.get(
    "/verification-status/:propertyId",
    protect,
    satelliteController.getVerificationStatus
);

module.exports = router;