const Property = require('../src/models/property.model');
const User = require('../src/models/user.model');
const CarbonCoin = require('../src/models/carbonCoin.model');
const SatelliteService = require('../src/services/satellite.service');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Mock axios to intercept satellite service calls
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

describe('Carbon Coin Awarding Based on Satellite Analysis Tests', () => {
  let userId;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up collections
    await Property.deleteMany({});
    await User.deleteMany({});
    await CarbonCoin.deleteMany({});
    
    // Create a test user
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword123',
      name: 'Test User',
      phone: '1234567890',
      address: 'Test Address',
      verified: true,
      type: 'seller'
    });
    
    userId = testUser._id;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should award carbon coins based on satellite analysis results', async () => {
    // Mock satellite service response with specific carbon credits
    const carbonCreditsFromAnalysis = 25;
    const axios = require('axios');
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        status: 'success',
        data: {
          meta: {
            image_date: '2023-01-01',
            processing_time: 5.2
          },
          summary: {
            total_area_ha: 0.25,
            carbon_credits_year: carbonCreditsFromAnalysis, // This is the amount that should be awarded
            green_points_year: 25000
          },
          breakdown: [
            {
              type: 'Trees/Forest',
              area_ha: 0.25,
              credits: carbonCreditsFromAnalysis,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring',
            analysis: 'base64encodedstring'
          }
        }
      }
    });

    // Create a property
    const property = await Property.create({
      SellerId: userId,
      title: 'Test Property',
      description: 'Test Description',
      geotaggedImagesUrls: ['http://example.com/image.jpg'],
      address: 'Test Address',
      boundaryCoordinates: [
        { lat: 22.5645, lng: 72.9289 }
      ],
      areaInSqFt: 1000
    });

    // Initially, the user should have no carbon coins
    let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeFalsy(); // Should not exist yet

    // Call the satellite verification method which should award coins
    await SatelliteService.analyzePropertyWithSatellite(
      property._id,
      property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]), // Format as [lng, lat]
      userId
    );

    // After verification, the user should have carbon coins equal to the analysis result
    carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeTruthy();
    expect(carbonCoinRecord.amount).toBe(carbonCreditsFromAnalysis);
    expect(carbonCoinRecord.history).toHaveLength(1);
    expect(carbonCoinRecord.history[0].amount).toBe(carbonCreditsFromAnalysis);
    expect(carbonCoinRecord.history[0].propertyId.toString()).toBe(property._id.toString());
    expect(carbonCoinRecord.history[0].reason).toBe('satellite_verification');
  });

  test('should add to existing carbon coin balance', async () => {
    // Create a carbon coin record with existing balance
    const initialBalance = 10;
    await CarbonCoin.create({
      ownerId: userId,
      amount: initialBalance,
      history: [
        {
          date: new Date(),
          amount: initialBalance,
          propertyId: new mongoose.Types.ObjectId(),
          reason: 'previous_verification'
        }
      ]
    });

    // Mock satellite service response with additional carbon credits
    const additionalCredits = 15;
    const axios = require('axios');
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        status: 'success',
        data: {
          meta: {
            image_date: '2023-01-01',
            processing_time: 5.2
          },
          summary: {
            total_area_ha: 0.15,
            carbon_credits_year: additionalCredits,
            green_points_year: 15000
          },
          breakdown: [
            {
              type: 'Trees/Forest',
              area_ha: 0.15,
              credits: additionalCredits,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring',
            analysis: 'base64encodedstring'
          }
        }
      }
    });

    // Create a property
    const property = await Property.create({
      SellerId: userId,
      title: 'Test Property',
      description: 'Test Description',
      geotaggedImagesUrls: ['http://example.com/image.jpg'],
      address: 'Test Address',
      boundaryCoordinates: [
        { lat: 22.5645, lng: 72.9289 }
      ],
      areaInSqFt: 1000
    });

    // Verify initial state
    let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord.amount).toBe(initialBalance);
    expect(carbonCoinRecord.history).toHaveLength(1);

    // Call the satellite verification method which should add to existing balance
    await SatelliteService.analyzePropertyWithSatellite(
      property._id,
      property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]), // Format as [lng, lat]
      userId
    );

    // After verification, the balance should be increased
    carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord.amount).toBe(initialBalance + additionalCredits);
    expect(carbonCoinRecord.history).toHaveLength(2); // Should have 2 history entries now
    
    // Check that the new entry is correct
    const latestEntry = carbonCoinRecord.history[carbonCoinRecord.history.length - 1];
    expect(latestEntry.amount).toBe(additionalCredits);
    expect(latestEntry.propertyId.toString()).toBe(property._id.toString());
    expect(latestEntry.reason).toBe('satellite_verification');
  });

  test('should create carbon coin record if it does not exist', async () => {
    // Verify that no carbon coin record exists initially
    let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeFalsy();

    // Mock satellite service response
    const carbonCredits = 20;
    const axios = require('axios');
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        status: 'success',
        data: {
          meta: {
            image_date: '2023-01-01',
            processing_time: 5.2
          },
          summary: {
            total_area_ha: 0.2,
            carbon_credits_year: carbonCredits,
            green_points_year: 20000
          },
          breakdown: [
            {
              type: 'Trees/Forest',
              area_ha: 0.2,
              credits: carbonCredits,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring',
            analysis: 'base64encodedstring'
          }
        }
      }
    });

    // Create a property
    const property = await Property.create({
      SellerId: userId,
      title: 'Test Property',
      description: 'Test Description',
      geotaggedImagesUrls: ['http://example.com/image.jpg'],
      address: 'Test Address',
      boundaryCoordinates: [
        { lat: 22.5645, lng: 72.9289 }
      ],
      areaInSqFt: 1000
    });

    // Call the satellite verification method
    await SatelliteService.analyzePropertyWithSatellite(
      property._id,
      property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]), // Format as [lng, lat]
      userId
    );

    // Verify that a new carbon coin record was created
    carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeTruthy();
    expect(carbonCoinRecord.amount).toBe(carbonCredits);
    expect(carbonCoinRecord.history).toHaveLength(1);
    expect(carbonCoinRecord.history[0].amount).toBe(carbonCredits);
    expect(carbonCoinRecord.history[0].reason).toBe('satellite_verification');
  });

  test('should handle satellite analysis with zero carbon credits', async () => {
    // Mock satellite service response with zero carbon credits
    const axios = require('axios');
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        status: 'success',
        data: {
          meta: {
            image_date: '2023-01-01',
            processing_time: 5.2
          },
          summary: {
            total_area_ha: 0.0,
            carbon_credits_year: 0, // Zero credits
            green_points_year: 0
          },
          breakdown: [
            {
              type: 'Built/Barren',
              area_ha: 0.0,
              credits: 0,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring',
            analysis: 'base64encodedstring'
          }
        }
      }
    });

    // Create a property
    const property = await Property.create({
      SellerId: userId,
      title: 'Test Property',
      description: 'Test Description',
      geotaggedImagesUrls: ['http://example.com/image.jpg'],
      address: 'Test Address',
      boundaryCoordinates: [
        { lat: 22.5645, lng: 72.9289 }
      ],
      areaInSqFt: 1000
    });

    // Initially, no carbon coin record should exist
    let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeFalsy();

    // Call the satellite verification method
    await SatelliteService.analyzePropertyWithSatellite(
      property._id,
      property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]), // Format as [lng, lat]
      userId
    );

    // A carbon coin record should still be created with zero balance
    carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeTruthy();
    expect(carbonCoinRecord.amount).toBe(0);
    expect(carbonCoinRecord.history).toHaveLength(1);
    expect(carbonCoinRecord.history[0].amount).toBe(0);
  });

  test('should handle multiple properties awarding carbon coins', async () => {
    // Mock satellite service response
    const axios = require('axios');
    
    // First property verification
    jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          meta: {
            image_date: '2023-01-01',
            processing_time: 5.2
          },
          summary: {
            total_area_ha: 0.1,
            carbon_credits_year: 10,
            green_points_year: 10000
          },
          breakdown: [
            {
              type: 'Trees/Forest',
              area_ha: 0.1,
              credits: 10,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring1',
            analysis: 'base64encodedstring1'
          }
        }
      }
    });

    // Second property verification
    jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          meta: {
            image_date: '2023-01-02',
            processing_time: 4.8
          },
          summary: {
            total_area_ha: 0.15,
            carbon_credits_year: 15,
            green_points_year: 15000
          },
          breakdown: [
            {
              type: 'Trees/Forest',
              area_ha: 0.15,
              credits: 15,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring2',
            analysis: 'base64encodedstring2'
          }
        }
      }
    });

    // Create first property
    const property1 = await Property.create({
      SellerId: userId,
      title: 'Property 1',
      description: 'Description 1',
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      address: 'Address 1',
      boundaryCoordinates: [
        { lat: 22.5645, lng: 72.9289 }
      ],
      areaInSqFt: 1000
    });

    // Create second property
    const property2 = await Property.create({
      SellerId: userId,
      title: 'Property 2',
      description: 'Description 2',
      geotaggedImagesUrls: ['http://example.com/image2.jpg'],
      address: 'Address 2',
      boundaryCoordinates: [
        { lat: 22.5650, lng: 72.9300 }
      ],
      areaInSqFt: 1200
    });

    // Verify initial state
    let carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord).toBeFalsy();

    // Verify first property
    await SatelliteService.analyzePropertyWithSatellite(
      property1._id,
      property1.boundaryCoordinates.map(coord => [coord.lng, coord.lat]),
      userId
    );

    carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord.amount).toBe(10);
    expect(carbonCoinRecord.history).toHaveLength(1);

    // Verify second property
    await SatelliteService.analyzePropertyWithSatellite(
      property2._id,
      property2.boundaryCoordinates.map(coord => [coord.lng, coord.lat]),
      userId
    );

    carbonCoinRecord = await CarbonCoin.findOne({ ownerId: userId });
    expect(carbonCoinRecord.amount).toBe(25); // 10 + 15
    expect(carbonCoinRecord.history).toHaveLength(2);

    // Verify that both history entries are for the correct properties
    const historyPropertyIds = carbonCoinRecord.history.map(entry => entry.propertyId.toString());
    expect(historyPropertyIds).toContain(property1._id.toString());
    expect(historyPropertyIds).toContain(property2._id.toString());
  });
});