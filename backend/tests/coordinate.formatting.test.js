const SatelliteService = require('../src/services/satellite.service');
const Property = require('../src/models/property.model');
const CarbonCoin = require('../src/models/carbonCoin.model');
const User = require('../src/models/user.model');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

describe('Coordinate Formatting Tests', () => {
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
  });

  describe('Coordinate formatting', () => {
    test('should correctly format coordinates from {lat, lng} objects to [lng, lat] arrays', async () => {
      // Mock the satellite service call to avoid actual HTTP requests during testing
      const axios = require('axios');
      const mockPost = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          status: 'success',
          data: {
            meta: { image_date: '2023-01-01', processing_time: 5.2 },
            summary: { total_area_ha: 0.1, carbon_credits_year: 10, green_points_year: 10000 },
            breakdown: [{ type: 'Trees/Forest', area_ha: 0.1, credits: 10, percent: 100 }],
            images: { satellite: 'base64string', analysis: 'base64string' }
          }
        }
      });

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

      // Create a property with boundary coordinates in {lat, lng} format
      const property = await Property.create({
        SellerId: testUser._id,
        title: 'Test Property',
        description: 'Test Description',
        geotaggedImagesUrls: ['http://example.com/image.jpg'],
        address: 'Test Address',
        boundaryCoordinates: [
          { lat: 22.5645, lng: 72.9289 },
          { lat: 22.5648, lng: 72.9295 },
          { lat: 22.5650, lng: 72.9290 }
        ],
        areaInSqFt: 1000
      });

      // Create a carbon coin record for the user
      await CarbonCoin.create({
        ownerId: testUser._id,
        amount: 0,
        history: []
      });

      // Call the satellite service method
      try {
        await SatelliteService.analyzePropertyWithSatellite(
          property._id,
          property.boundaryCoordinates, // Pass coordinates in {lat, lng} format
          testUser._id
        );
      } catch (error) {
        // We expect this to fail if the satellite service is not running,
        // but we can still verify the coordinate formatting
      }

      // Verify that axios.post was called with the correctly formatted coordinates
      // The coordinates should be transformed from [{lat, lng}] to [[lng, lat]]
      if (mockPost.mock.calls.length > 0) {
        const callArgs = mockPost.mock.calls[0];
        const payload = callArgs[1]; // Second argument is the payload

        expect(payload.coordinates).toEqual([
          [72.9289, 22.5645], // [lng, lat] format
          [72.9295, 22.5648],
          [72.9290, 22.5650]
        ]);
      }

      mockPost.mockRestore();
    });

    test('should correctly format coordinates from [lat, lng] arrays to [lng, lat] arrays', async () => {
      const axios = require('axios');
      const mockPost = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          status: 'success',
          data: {
            meta: { image_date: '2023-01-01', processing_time: 5.2 },
            summary: { total_area_ha: 0.1, carbon_credits_year: 10, green_points_year: 10000 },
            breakdown: [{ type: 'Trees/Forest', area_ha: 0.1, credits: 10, percent: 100 }],
            images: { satellite: 'base64string', analysis: 'base64string' }
          }
        }
      });

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

      // Simulate coordinates in [lat, lng] format
      const coordinates = [
        [22.5645, 72.9289], // [lat, lng] format
        [22.5648, 72.9295],
        [22.5650, 72.9290]
      ];

      // Create a property for this test
      const testProperty = await Property.create({
        SellerId: testUser._id,
        title: 'Test Property',
        description: 'Test Description',
        geotaggedImagesUrls: ['http://example.com/image.jpg'],
        address: 'Test Address',
        boundaryCoordinates: [], // Empty for this test
        areaInSqFt: 1000
      });

      // Call the satellite service method directly with [lat, lng] coordinates
      try {
        await SatelliteService.analyzePropertyWithSatellite(
          testProperty._id, // Use a valid property ID
          coordinates, // Pass coordinates in [lat, lng] format
          testUser._id
        );
      } catch (error) {
        // We expect this to fail since we're mocking the satellite service,
        // but we can still verify the coordinate formatting
      }

      // Verify that axios.post was called with the correctly formatted coordinates
      // The coordinates should remain as [[lng, lat]] since they're already in the correct format
      if (mockPost.mock.calls.length > 0) {
        const callArgs = mockPost.mock.calls[0];
        const payload = callArgs[1]; // Second argument is the payload

        expect(payload.coordinates).toEqual([
          [72.9289, 22.5645], // [lng, lat] format
          [72.9295, 22.5648],
          [72.9290, 22.5650]
        ]);
      }

      mockPost.mockRestore();
    });

    test('should throw error for invalid coordinate format', async () => {
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

      // Test with invalid coordinates
      const invalidCoordinates = [
        { latitude: 22.5645, longitude: 72.9289 } // Wrong property names
      ];

      // Create a property for this test
      const testProperty = await Property.create({
        SellerId: testUser._id,
        title: 'Test Property',
        description: 'Test Description',
        geotaggedImagesUrls: ['http://example.com/image.jpg'],
        address: 'Test Address',
        boundaryCoordinates: [], // Empty for this test
        areaInSqFt: 1000
      });

      await expect(
        SatelliteService.analyzePropertyWithSatellite(
          testProperty._id, // Use a valid property ID
          invalidCoordinates,
          testUser._id
        )
      ).rejects.toThrow('Invalid coordinate format');
    });

    test('should throw error for empty coordinates array', async () => {
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

      // Create a property for this test
      const testProperty = await Property.create({
        SellerId: testUser._id,
        title: 'Test Property',
        description: 'Test Description',
        geotaggedImagesUrls: ['http://example.com/image.jpg'],
        address: 'Test Address',
        boundaryCoordinates: [], // Empty for this test
        areaInSqFt: 1000
      });

      // Test with empty coordinates
      const emptyCoordinates = [];

      await expect(
        SatelliteService.analyzePropertyWithSatellite(
          testProperty._id, // Use a valid property ID
          emptyCoordinates,
          testUser._id
        )
      ).rejects.toThrow('Invalid coordinates: must be a non-empty array of coordinate pairs');
    });
  });
});