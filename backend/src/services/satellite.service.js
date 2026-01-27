const Property = require("../models/property.model");
const CarbonCoin = require("../models/carbonCoin.model");
const { Queue, Worker } = require("bullmq");
const axios = require("axios");
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
};

// Queue for satellite verification jobs
let satelliteQueue;
let satelliteWorker;

// Initialize queue and worker with error handling
try {
    satelliteQueue = new Queue('satellite-verification', { connection: redisConnection });
} catch (error) {
    console.error('Failed to connect to Redis for satellite verification queue:', error.message);
    // Create a mock queue for graceful degradation
    satelliteQueue = {
        add: async (name, data, opts) => {
            console.warn('Redis not available. Satellite verification will not be processed.');
            throw new Error('Redis connection failed. Satellite verification service unavailable.');
        }
    };
}

class SatelliteService {
    constructor() {
        this.initializeWorker();
    }

    // Initialize the worker to process satellite verification jobs
    initializeWorker() {
        try {
            satelliteWorker = new Worker('satellite-verification', this.processSatelliteJob.bind(this), {
                connection: redisConnection
            });

            satelliteWorker.on('completed', (job) => {
                console.log(`Job ${job.id} completed successfully`);
            });

            satelliteWorker.on('failed', (job, err) => {
                console.log(`Job ${job.id} failed with error: ${err.message}`);
                // Update property status to failed
                this.updatePropertyVerificationStatus(job.data.propertyId, 'failed', err.message);
            });
        } catch (error) {
            console.error('Failed to initialize satellite verification worker:', error.message);
        }
    }

    // Process satellite verification job
    async processSatelliteJob(job) {
        const { propertyId, userId, boundaryCoordinates } = job.data;

        try {
            // Update property status to processing
            await this.updatePropertyVerificationStatus(propertyId, 'processing');

            // Call the Flask satellite verification API
            const flaskApiUrl = process.env.FLASK_SATELLITE_API_URL || 'http://localhost:5000/calculate';
            
            const response = await axios.post(flaskApiUrl, {
                coordinates: boundaryCoordinates,
                startDate: '2023-01-01',
                endDate: '2024-12-30'
            }, {
                timeout: 300000 // 5 minute timeout for satellite processing
            });

            const verificationResults = response.data;

            // Calculate carbon credits based on satellite analysis
            const carbonCredits = verificationResults.total_annual_carbon_sequestration_tonnes;

            // Update property with verification results
            await Property.findByIdAndUpdate(propertyId, {
                satelliteVerification: {
                    status: 'verified',
                    results: verificationResults,
                    carbonCredits: carbonCredits,
                    timestamp: new Date()
                }
            });

            // Update user's carbon coin balance
            let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
            if (carbonCoinRecord) {
                carbonCoinRecord.amount += carbonCredits;
                carbonCoinRecord.history.push({
                    date: new Date(),
                    amount: carbonCredits,
                    propertyId: propertyId,
                    type: 'satellite_verification'
                });
                await carbonCoinRecord.save();
            } else {
                carbonCoinRecord = await CarbonCoin.create({
                    ownerId: userId,
                    amount: carbonCredits,
                    history: [{
                        date: new Date(),
                        amount: carbonCredits,
                        propertyId: propertyId,
                        type: 'satellite_verification'
                    }]
                });
            }

            console.log(`Satellite verification completed for property ${propertyId}. Awarded ${carbonCredits} carbon credits.`);

            return {
                propertyId,
                carbonCredits,
                verificationResults
            };
        } catch (error) {
            console.error(`Satellite verification failed for property ${propertyId}:`, error.message);
            throw error;
        }
    }

    // Initiate satellite verification by adding job to queue
    async initiateSatelliteVerification(propertyId, userId) {
        // Get property to check if it has boundary coordinates
        const property = await Property.findById(propertyId);

        if (!property) {
            throw new Error("Property not found");
        }

        if (!property.boundaryCoordinates || property.boundaryCoordinates.length < 3) {
            throw new Error("Property must have at least 3 boundary coordinates to perform satellite verification");
        }

        // Check if property already has satellite verification in progress
        if (property.satelliteVerification && property.satelliteVerification.status === 'processing') {
            throw new Error("Satellite verification is already in progress for this property");
        }

        // Add job to queue
        let job;
        try {
            job = await satelliteQueue.add('satellite-verification', {
                propertyId,
                userId,
                boundaryCoordinates: property.boundaryCoordinates
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                timeout: 300000, // 5 minutes
            });
        } catch (queueError) {
            console.error('Failed to add satellite verification job to queue:', queueError.message);
            // Update property status to failed
            await Property.findByIdAndUpdate(propertyId, {
                satelliteVerification: {
                    status: 'failed',
                    error: `Queue error: ${queueError.message}`,
                    timestamp: new Date()
                }
            });
            throw new Error(`Failed to queue satellite verification: ${queueError.message}`);
        }

        // Update property status to queued
        await Property.findByIdAndUpdate(propertyId, {
            satelliteVerification: {
                status: 'queued',
                timestamp: new Date()
            }
        });

        return {
            jobId: job.id,
            propertyId,
            status: 'queued'
        };
    }

    // Get verification status for a property
    async getVerificationStatus(propertyId) {
        const property = await Property.findById(propertyId);
        
        if (!property) {
            throw new Error("Property not found");
        }

        return {
            propertyId,
            status: property.satelliteVerification?.status || 'not_started',
            results: property.satelliteVerification?.results,
            carbonCredits: property.satelliteVerification?.carbonCredits,
            timestamp: property.satelliteVerification?.timestamp
        };
    }

    // Update property verification status
    async updatePropertyVerificationStatus(propertyId, status, errorMessage = null) {
        const updateObj = {
            'satelliteVerification.status': status,
            'satelliteVerification.timestamp': new Date()
        };

        if (errorMessage) {
            updateObj['satelliteVerification.error'] = errorMessage;
        }

        await Property.findByIdAndUpdate(propertyId, updateObj);
    }
}

module.exports = new SatelliteService();