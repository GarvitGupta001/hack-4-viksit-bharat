const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Adjust path as needed
const Property = require('../src/models/property.model');
const User = require('../src/models/user.model');

let mongoServer;

// Mock user data
const mockUser = {
    name: 'Test User',
    email: 'testoverlap@example.com',
    password: 'Password123!',
    phone: '1234567890',
    role: 'user'
};

// Mock property data with coordinates
const mockProperty1 = {
    title: 'Test Property 1',
    description: 'Test property description 1',
    address: '123 Main St, City, State',
    areaInSqFt: 1000,
    boundaryCoordinates: [
        [72.9289, 22.5645], // [lng, lat]
        [72.9295, 22.5648],
        [72.9290, 22.5650],
        [72.9285, 22.5647]
    ]
};

const mockProperty2 = {
    title: 'Test Property 2',
    description: 'Test property description 2',
    address: '456 Oak Ave, City, State',
    areaInSqFt: 1200,
    boundaryCoordinates: [
        [72.9290, 22.5646], // Slightly overlapping coordinates
        [72.9296, 22.5649],
        [72.9291, 22.5651],
        [72.9286, 22.5648]
    ]
};

describe('Property Overlap Prevention Integration Tests', () => {
    let authToken;
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
        // Clean up collections before each test
        await Property.deleteMany({});
        await User.deleteMany({});
        
        // Create a user and get auth token
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(mockUser)
            .expect(201);
            
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: mockUser.email,
                password: mockUser.password
            })
            .expect(200);
            
        authToken = loginResponse.body.token;
        userId = loginResponse.body.user._id;
    });

    afterEach(async () => {
        // Clean up collections after each test
        await Property.deleteMany({});
        await User.deleteMany({});
    });

    test('should create property successfully when no overlap exists', async () => {
        const response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', mockProperty1.title)
            .field('description', mockProperty1.description)
            .field('address', mockProperty1.address)
            .field('areaInSqFt', mockProperty1.areaInSqFt)
            .field('boundaryCoordinates', JSON.stringify(mockProperty1.boundaryCoordinates))
            .attach('images', Buffer.from('fake image data'), 'test1.jpg')
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Property created successfully');
    });

    test('should return conflict when creating overlapping property', async () => {
        // First, create a property
        let response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', mockProperty1.title)
            .field('description', mockProperty1.description)
            .field('address', mockProperty1.address)
            .field('areaInSqFt', mockProperty1.areaInSqFt)
            .field('boundaryCoordinates', JSON.stringify(mockProperty1.boundaryCoordinates))
            .attach('images', Buffer.from('fake image data'), 'test1.jpg')
            .expect(201);

        expect(response.body.success).toBe(true);

        // Try to create a second property with overlapping coordinates
        response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', mockProperty2.title)
            .field('description', mockProperty2.description)
            .field('address', mockProperty2.address)
            .field('areaInSqFt', mockProperty2.areaInSqFt)
            .field('boundaryCoordinates', JSON.stringify(mockProperty2.boundaryCoordinates))
            .attach('images', Buffer.from('fake image data'), 'test2.jpg')
            .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Property overlaps with existing property');
    });

    test('should allow property creation when overlap is within 10% threshold', async () => {
        // Create first property
        let response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', mockProperty1.title)
            .field('description', mockProperty1.description)
            .field('address', mockProperty1.address)
            .field('areaInSqFt', mockProperty1.areaInSqFt)
            .field('boundaryCoordinates', JSON.stringify(mockProperty1.boundaryCoordinates))
            .attach('images', Buffer.from('fake image data'), 'test1.jpg')
            .expect(201);

        expect(response.body.success).toBe(true);

        // Create a property with minimal overlap (should be allowed)
        const nonOverlappingProperty = {
            ...mockProperty2,
            title: 'Non-overlapping Property',
            address: '789 Pine St, City, State',
            // Using coordinates that should not significantly overlap
            boundaryCoordinates: [
                [73.0000, 23.0000],
                [73.0005, 23.0000],
                [73.0005, 23.0005],
                [73.0000, 23.0005]
            ]
        };

        response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', nonOverlappingProperty.title)
            .field('description', nonOverlappingProperty.description)
            .field('address', nonOverlappingProperty.address)
            .field('areaInSqFt', nonOverlappingProperty.areaInSqFt)
            .field('boundaryCoordinates', JSON.stringify(nonOverlappingProperty.boundaryCoordinates))
            .attach('images', Buffer.from('fake image data'), 'test3.jpg')
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Property created successfully');
    });

    test('should return conflict when updating property to overlapping coordinates', async () => {
        // Create first property
        let response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', mockProperty1.title)
            .field('description', mockProperty1.description)
            .field('address', mockProperty1.address)
            .field('areaInSqFt', mockProperty1.areaInSqFt)
            .field('boundaryCoordinates', JSON.stringify(mockProperty1.boundaryCoordinates))
            .attach('images', Buffer.from('fake image data'), 'test1.jpg')
            .expect(201);

        expect(response.body.success).toBe(true);
        const firstPropertyId = response.body.data.property._id;

        // Create second property at a different location
        response = await request(app)
            .post('/api/properties/')
            .set('Authorization', `Bearer ${authToken}`)
            .field('title', 'Second Property')
            .field('description', 'Another test property')
            .field('address', '789 Pine St, City, State')
            .field('areaInSqFt', 800)
            .field('boundaryCoordinates', JSON.stringify([
                [73.0000, 23.0000],
                [73.0005, 23.0000],
                [73.0005, 23.0005],
                [73.0000, 23.0005]
            ]))
            .attach('images', Buffer.from('fake image data'), 'test2.jpg')
            .expect(201);

        expect(response.body.success).toBe(true);
        const secondPropertyId = response.body.data.property._id;

        // Try to update the second property to have overlapping coordinates with the first
        response = await request(app)
            .put(`/api/properties/${secondPropertyId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                ...mockProperty2,
                boundaryCoordinates: mockProperty2.boundaryCoordinates
            })
            .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Updated property overlaps with existing property');
    });
});