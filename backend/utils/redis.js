const Redis = require("ioredis");

const connectRedis = () => {
    console.log("Connecting to Redis...");
    console.log(process.env.REDIS_HOST);
    console.log(process.env.REDIS_PORT);
    console.log(process.env.REDIS_PASSWORD);
    const connection = new Redis(
        {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
        },
        {
            maxRetriesPerRequest: null,
        },
    );
    return connection;
};

module.exports = connectRedis;
