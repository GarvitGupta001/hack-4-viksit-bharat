// API Integration Tests for CarbonCoin Marketplace
import apiClient from '../services/api';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Service Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear();
    
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication API Tests', () => {
    test('should register a new user', async () => {
      // Arrange
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
        address: 'Test Address',
        type: 'seller'
      };
      
      const mockResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            name: 'Test User',
            phone: '1234567890',
            type: 'seller',
            verified: false
          }
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.register(mockUserData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockUserData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should login a user', async () => {
      // Arrange
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            name: 'Test User',
            phone: '1234567890',
            type: 'seller',
            verified: false
          }
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.login(mockCredentials);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockCredentials),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should get user profile', async () => {
      // Arrange
      const mockToken = 'mock-jwt-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const mockResponse = {
        success: true,
        data: {
          id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User',
          phone: '1234567890',
          type: 'seller',
          verified: false
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.getProfile();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/profile',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors', async () => {
      // Arrange
      const mockError = {
        success: false,
        message: 'Invalid credentials'
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      });

      // Act & Assert
      await expect(apiClient.login({ email: 'invalid', password: 'invalid' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Property API Tests', () => {
    test('should create a property', async () => {
      // Arrange
      const mockToken = 'mock-jwt-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const mockPropertyData = {
        title: 'Test Property',
        description: 'Test Description',
        address: 'Test Address',
        boundaryCoordinates: [{ lat: 1, lng: 1 }],
        areaInSqFt: 1000
      };
      
      const mockImage = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      const mockResponse = {
        success: true,
        message: 'Property created successfully',
        data: {
          property: { id: 'mock-property-id', ...mockPropertyData },
          coinsEarned: 10
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.createProperty(mockPropertyData, [mockImage]);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/properties/',
        expect.objectContaining({
          method: 'POST',
          headers: {} // Empty headers for multipart/form-data
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should get all properties', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          properties: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.getAllProperties();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/properties',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Carbon Coin API Tests', () => {
    test('should get carbon coin balance', async () => {
      // Arrange
      const mockToken = 'mock-jwt-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const mockResponse = {
        success: true,
        data: {
          ownerId: 'mock-user-id',
          amount: 100,
          history: []
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.getCarbonCoinBalance();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/carboncoins/balance',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should get marketplace stats', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          totalCoinsInCirculation: 1000,
          totalSellers: 5,
          totalCompanies: 3
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.getMarketplaceStats();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/carboncoins/stats',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Logout Functionality', () => {
    test('should clear all localStorage items on logout', async () => {
      // Act
      const result = await apiClient.logout();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('isLoggedIn');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('identityVerified');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('carbonCoins');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userName');
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
    });
  });
});