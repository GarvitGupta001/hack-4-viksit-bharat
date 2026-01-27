require("dotenv").config();
const { Worker } = require("bullmq");
const axios = require("axios");
const connectDB = require("./utils/db");
connectDB();
const User = require("./src/models/user.model");
const Seller = require("./src/models/seller.model");
const connectRedis = require("./utils/redis");

const connection = connectRedis();

const worker = new Worker(
    "seller_verification_queue",
    async (job) => {
        console.log(`Processing job ${job.id} for user ${job.data.userId}`);
        try {
            const response = await axios.post(
                "http://localhost:8000/api/verify-face",
                {
                    userId: job.data.userId,
                },
            );
            if (response.status !== 200) {
                throw new Error(
                    `Failed to verify user ${job.data.userId}: ${response.data.message}`,
                );
            }
            if (response.data.verified) {
                await User.findByIdAndUpdate(job.data.userId, {
                    verified: true,
                });
            } else {
                await Seller.findOneAndUpdate(
                    { userId: job.data.userId },
                    { aadharUrl: null, selfieUrl: null },
                    { new: true },
                );
            }
            console.log(
                `Notification sent for user ${job.data.userId}: ${response.status}`,
            );
        } catch (error) {
            console.error(
                `Error processing job ${job.id} for user ${job.data.userId}: ${error.message}`,
            );
            throw error; // Rethrow to mark the job as failed
        }
    },
    { connection },
);

worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
    Seller.findOneAndUpdate(
        { userId: job.data.userId },
        { aadharUrl: null, selfieUrl: null },
        { new: true },
    );
});
worker.on("completed", (job) => {
    console.log(`${job.id} completed successfully`);
});
