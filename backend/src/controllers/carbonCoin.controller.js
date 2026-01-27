const carbonCoinService = require("../services/carbonCoin.service");

class CarbonCoinController {
    async getBalance(req, res, next) {
        try {
            const balance = await carbonCoinService.getBalance(req.user._id);
            res.status(200).json({
                success: true,
                data: balance,
            });
        } catch (error) {
            next(error);
        }
    }

    async getHistory(req, res, next) {
        try {
            const history = await carbonCoinService.getHistory(req.user._id, req.query);
            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            next(error);
        }
    }

    async transferCoins(req, res, next) {
        try {
            const { toUserId, amount } = req.body;

            if (!toUserId || !amount) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide toUserId and amount",
                });
            }

            const result = await carbonCoinService.transferCoins(
                req.user._id,
                toUserId,
                amount
            );

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    senderBalance: result.senderBalance,
                    receiverBalance: result.receiverBalance,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getLeaderboard(req, res, next) {
        try {
            const leaderboard = await carbonCoinService.getLeaderboard(req.query);
            res.status(200).json({
                success: true,
                data: leaderboard,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMarketplaceStats(req, res, next) {
        try {
            const stats = await carbonCoinService.getMarketplaceStats();
            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CarbonCoinController();