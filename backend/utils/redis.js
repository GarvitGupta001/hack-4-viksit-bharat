const Redis = require("ioredis");

const connectRedis = () => {
    const connection = new Redis(
        process.env.REDIS_URL || "redis://127.0.0.1:6379",
        {
            maxRetriesPerRequest: null,
        },
    );
    return connection;
};

module.exports = connectRedis;
