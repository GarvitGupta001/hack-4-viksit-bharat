const CarbonCoin = require("../models/carbonCoin.model");
const User = require("../models/user.model");

class CarbonCoinService {
    async getBalance(userId) {
        const carbonCoin = await CarbonCoin.findOne({ ownerId: userId });
        if (!carbonCoin) {
            throw new Error("Carbon coin account not found");
        }
        return carbonCoin;
    }

    async getHistory(userId, query) {
        const { page = 1, limit = 20 } = query;

        const carbonCoin = await CarbonCoin.findOne({ ownerId: userId }).populate(
            "history.propertyId",
            "title address"
        );

        if (!carbonCoin) {
            throw new Error("Carbon coin account not found");
        }

        const history = carbonCoin.history.sort((a, b) => b.date - a.date);
        const total = history.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedHistory = history.slice(startIndex, endIndex);

        return {
            balance: carbonCoin.amount,
            history: paginatedHistory,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        };
    }

    async transferCoins(fromUserId, toUserId, amount) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        // Check sender's balance
        const senderCoin = await CarbonCoin.findOne({ ownerId: fromUserId });
        if (!senderCoin || senderCoin.amount < amount) {
            throw new Error("Insufficient balance");
        }

        // Check if receiver exists and is a company
        const receiver = await User.findById(toUserId);
        if (!receiver || receiver.type !== "company") {
            throw new Error("Invalid receiver");
        }

        // Get or create receiver's carbon coin account
        let receiverCoin = await CarbonCoin.findOne({ ownerId: toUserId });
        if (!receiverCoin) {
            receiverCoin = await CarbonCoin.create({
                ownerId: toUserId,
                amount: 0,
                history: [],
            });
        }

        // Perform transfer
        senderCoin.amount -= amount;
        senderCoin.history.push({
            date: new Date(),
            amount: -amount,
        });
        await senderCoin.save();

        receiverCoin.amount += amount;
        receiverCoin.history.push({
            date: new Date(),
            amount: amount,
        });
        await receiverCoin.save();

        return {
            message: "Transfer successful",
            senderBalance: senderCoin.amount,
            receiverBalance: receiverCoin.amount,
        };
    }

    async getLeaderboard(query) {
        const { page = 1, limit = 10 } = query;

        const leaderboard = await CarbonCoin.find()
            .populate("ownerId", "name email type")
            .sort({ amount: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await CarbonCoin.countDocuments();

        return {
            leaderboard,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        };
    }

    async getMarketplaceStats() {
        const totalCoins = await CarbonCoin.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);

        const sellerCount = await User.countDocuments({ type: "seller" });
        const companyCount = await User.countDocuments({ type: "company" });

        return {
            totalCoinsInCirculation: totalCoins[0]?.total || 0,
            totalSellers: sellerCount,
            totalCompanies: companyCount,
        };
    }
}

module.exports = new CarbonCoinService();