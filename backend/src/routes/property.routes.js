const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.controller");
const { protect, authorize, verifyUser } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Create property (seller only, verified)
router.post(
    "/",
    protect,
    authorize("seller"),
    verifyUser,
    upload.array("images", 10),
    propertyController.createProperty
);

// Get all properties (public/authenticated)
router.get("/", propertyController.getAllProperties);

// Get my properties (seller only)
router.get("/my-properties", protect, authorize("seller"), propertyController.getMyProperties);

// Get single property
router.get("/:id", propertyController.getProperty);

// Update property (seller only)
router.put("/:id", protect, authorize("seller"), propertyController.updateProperty);

// Delete property (seller only)
router.delete("/:id", protect, authorize("seller"), propertyController.deleteProperty);

module.exports = router;