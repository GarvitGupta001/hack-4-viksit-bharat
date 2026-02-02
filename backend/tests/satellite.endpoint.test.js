const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Property = require('../src/models/property.model');
const User = require('../src/models/user.model');
const CarbonCoin = require('../src/models/carbonCoin.model');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Mock axios to intercept satellite service calls
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

describe('Satellite Verification API Endpoint Tests', () => {
  let authToken;
  let userId;
  let propertyId;

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
    
    // Create a carbon coin record for the user
    await CarbonCoin.create({
      ownerId: userId,
      amount: 0,
      history: []
    });
    
    // Generate JWT token (mocked for testing)
    authToken = 'mock-jwt-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/satellite/verify-property', () => {
    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .post('/api/satellite/verify-property')
        .send({
          propertyId: '507f1f77bcf86cd799439011',
          coordinates: [[72.9289, 22.5645]]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should return 403 if user is not authorized (wrong type)', async () => {
      // Mock the authentication middleware to return a company user
      const authMiddleware = require('../src/middlewares/auth');
      jest.spyOn(authMiddleware, 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'company' }; // Company user, not seller
        next();
      });
      
      jest.spyOn(authMiddleware, 'authorize').mockImplementation((...types) => (req, res, next) => {
        if (!types.includes(req.user.type)) {
          return res.status(403).json({
            success: false,
            message: `User type ${req.user.type} is not authorized to access this route`
          });
        }
        next();
      });

      const response = await request(app)
        .post('/api/satellite/verify-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: '507f1f77bcf86cd799439011',
          coordinates: [[72.9289, 22.5645]]
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not authorized');
    });

    it('should return 400 if propertyId or coordinates are missing', async () => {
      // Mock the authentication middleware
      const authMiddleware = require('../src/middlewares/auth');
      jest.spyOn(authMiddleware, 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(authMiddleware, 'authorize').mockImplementation((...types) => (req, res, next) => {
        next();
      });

      // Test missing propertyId
      let response = await request(app)
        .post('/api/satellite/verify-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coordinates: [[72.9289, 22.5645]]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');

      // Test missing coordinates
      response = await request(app)
        .post('/api/satellite/verify-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: '507f1f77bcf86cd799439011'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 200 and initiate satellite verification with valid data', async () => {
      // Create a property first
      const property = await Property.create({
        SellerId: userId,
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
      
      propertyId = property._id;

      // Mock successful satellite service response
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
              satellite: 'base64encodedstring',
              analysis: 'base64encodedstring'
            }
          }
        }
      });

      // Mock the authentication middleware
      const authMiddleware = require('../src/middlewares/auth');
      jest.spyOn(authMiddleware, 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(authMiddleware, 'authorize').mockImplementation((...types) => (req, res, next) => {
        next();
      });

      const response = await request(app)
        .post('/api/satellite/verify-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: propertyId.toString(),
          coordinates: [[72.9289, 22.5645], [72.9295, 22.5648], [72.9290, 22.5650]] // [lng, lat] format
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property satellite verification completed successfully');
    });

    it('should handle satellite service connection errors', async () => {
      // Create a property first
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

      // Mock satellite service connection error
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      // Mock the authentication middleware
      const authMiddleware = require('../src/middlewares/auth');
      jest.spyOn(authMiddleware, 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(authMiddleware, 'authorize').mockImplementation((...types) => (req, res, next) => {
        next();
      });

      const response = await request(app)
        .post('/api/satellite/verify-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: property._id.toString(),
          coordinates: [[72.9289, 22.5645]]
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/satellite/property/:propertyId', () => {
    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .get('/api/satellite/property/507f1f77bcf86cd799439011')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return satellite verification result for valid property', async () => {
      // Create a property with satellite verification data
      const property = await Property.create({
        SellerId: userId,
        title: 'Test Property',
        description: 'Test Description',
        geotaggedImagesUrls: ['http://example.com/image.jpg'],
        address: 'Test Address',
        boundaryCoordinates: [
          { lat: 22.5645, lng: 72.9289 }
        ],
        areaInSqFt: 1000,
        satelliteVerification: {
          status: 'verified',
          analysisDate: new Date(),
          totalAreaHa: 0.1,
          carbonCreditsYear: 10,
          greenPointsYear: 10000,
          breakdown: [
            {
              type: 'Trees/Forest',
              area_ha: 0.1,
              credits: 10,
              percent: 100
            }
          ],
          images: {
            satellite: 'base64encodedstring',
            analysis: 'base64encodedstring'
          },
          meta: {
            image_date: '2023-01-01',
            processing_time: 5.2
          }
        }
      });

      // Mock the authentication middleware
      const authMiddleware = require('../src/middlewares/auth');
      jest.spyOn(authMiddleware, 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });

      const response = await request(app)
        .get(`/api/satellite/property/${property._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('verified');
      expect(response.body.data.carbonCreditsYear).toBe(10);
    });

    it('should return error for non-existent property', async () => {
      // Mock the authentication middleware
      const authMiddleware = require('../src/middlewares/auth');
      jest.spyOn(authMiddleware, 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });

      const response = await request(app)
        .get('/api/satellite/property/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});