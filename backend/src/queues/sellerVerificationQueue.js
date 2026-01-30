const { Queue } = require("bullmq");
const connectRedis = require("../../utils/redis");

class SellerVerificationQueue {
    constructor() {
        const redisConnection = connectRedis();
        this.queue = new Queue("seller_verification_queue", {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 },
                removeOnComplete: true, // Prevents Redis memory bloat
            },
        });
    }
    async addJob(data) {
        await this.queue.add("seller_verification_job", data);
    }
}

module.exports = new SellerVerificationQueue();
