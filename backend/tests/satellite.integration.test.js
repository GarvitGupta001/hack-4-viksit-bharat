const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Property = require('../src/models/property.model');
const User = require('../src/models/user.model');
const CarbonCoin = require('../src/models/carbonCoin.model');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Mock the satellite service
const mockSatelliteService = {
  post: jest.fn(),
  get: jest.fn()
};

// Mock axios to intercept satellite service calls
jest.mock('axios', () => ({
  post: (...args) => mockSatelliteService.post(...args),
  get: (...args) => mockSatelliteService.get(...args)
}));

describe('Satellite Integration Tests', () => {
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
    
    // Generate JWT token (in a real test, you'd use your actual JWT signing)
    // For this test, we'll mock the authentication middleware
    authToken = 'mock-jwt-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/satellite/verify-property', () => {
    it('should initiate satellite verification for a property with valid coordinates', async () => {
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
      mockSatelliteService.post.mockResolvedValue({
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
      jest.spyOn(require('../src/middlewares/auth'), 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(require('../src/middlewares/auth'), 'authorize').mockImplementation((...types) => (req, res, next) => {
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
      
      // Verify satellite service was called with correct parameters
      expect(mockSatelliteService.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze',
        {
          coordinates: [[72.9289, 22.5645], [72.9295, 22.5648], [72.9290, 22.5650]]
        },
        expect.objectContaining({
          timeout: 60000
        })
      );
    });

    it('should return error if property does not exist', async () => {
      // Mock the authentication middleware
      jest.spyOn(require('../src/middlewares/auth'), 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(require('../src/middlewares/auth'), 'authorize').mockImplementation((...types) => (req, res, next) => {
        next();
      });

      const response = await request(app)
        .post('/api/satellite/verify-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: '507f1f77bcf86cd799439011', // Non-existent property ID
          coordinates: [[72.9289, 22.5645]]
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should return error if user does not own the property', async () => {
      // Create a property owned by a different user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'hashedpassword123',
        name: 'Other User',
        phone: '0987654321',
        address: 'Other Address',
        verified: true,
        type: 'seller'
      });

      const property = await Property.create({
        SellerId: otherUser._id,
        title: 'Test Property',
        description: 'Test Description',
        geotaggedImagesUrls: ['http://example.com/image.jpg'],
        address: 'Test Address',
        boundaryCoordinates: [
          { lat: 22.5645, lng: 72.9289 }
        ],
        areaInSqFt: 1000
      });

      // Mock the authentication middleware
      jest.spyOn(require('../src/middlewares/auth'), 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' }; // Different user
        next();
      });
      
      jest.spyOn(require('../src/middlewares/auth'), 'authorize').mockImplementation((...types) => (req, res, next) => {
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

    it('should handle satellite service errors gracefully', async () => {
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

      // Mock satellite service error
      mockSatelliteService.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      // Mock the authentication middleware
      jest.spyOn(require('../src/middlewares/auth'), 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(require('../src/middlewares/auth'), 'authorize').mockImplementation((...types) => (req, res, next) => {
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
    it('should return satellite verification result for a property', async () => {
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
      jest.spyOn(require('../src/middlewares/auth'), 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(require('../src/middlewares/auth'), 'authorize').mockImplementation((...types) => (req, res, next) => {
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

    it('should return error if property does not exist', async () => {
      // Mock the authentication middleware
      jest.spyOn(require('../src/middlewares/auth'), 'protect').mockImplementation((req, res, next) => {
        req.user = { _id: userId, type: 'seller' };
        next();
      });
      
      jest.spyOn(require('../src/middlewares/auth'), 'authorize').mockImplementation((...types) => (req, res, next) => {
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