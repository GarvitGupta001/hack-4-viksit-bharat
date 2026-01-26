const express = require("express");
const router = express.Router();
const carbonCoinController = require("../controllers/carbonCoin.controller");
const { protect, verifyUser } = require("../middleware/auth");

// Get balance
router.get("/balance", protect, carbonCoinController.getBalance);

// Get transaction history
router.get("/history", protect, carbonCoinController.getHistory);

// Transfer coins (seller to company)
router.post("/transfer", protect, verifyUser, carbonCoinController.transferCoins);

// Get leaderboard (public)
router.get("/leaderboard", carbonCoinController.getLeaderboard);

// Get marketplace stats (public)
router.get("/stats", carbonCoinController.getMarketplaceStats);

module.exports = router;