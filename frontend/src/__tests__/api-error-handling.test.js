// API Error Handling Tests
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

describe('API Error Handling Tests', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should handle network errors', async () => {
    // Arrange
    global.fetch.mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(apiClient.getProfile()).rejects.toThrow('Network error');
  });

  test('should handle 401 unauthorized errors', async () => {
    // Arrange
    const mockToken = 'invalid-token';
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' })
    });

    // Act & Assert
    await expect(apiClient.getProfile()).rejects.toThrow('Unauthorized');
  });

  test('should handle 404 not found errors', async () => {
    // Arrange
    const mockToken = 'valid-token';
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Resource not found' })
    });

    // Act & Assert
    await expect(apiClient.getProperty('non-existent-id')).rejects.toThrow('Resource not found');
  });

  test('should handle 500 server errors', async () => {
    // Arrange
    const mockToken = 'valid-token';
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' })
    });

    // Act & Assert
    await expect(apiClient.getCarbonCoinBalance()).rejects.toThrow('Internal server error');
  });

  test('should handle malformed JSON responses', async () => {
    // Arrange
    global.fetch.mockResolvedValueOnce({
      ok: true,
      // Intentionally not providing json method to simulate malformed response
      json: async () => {
        throw new Error('Unexpected token < in JSON');
      }
    });

    // Act & Assert
    await expect(apiClient.getMarketplaceStats()).rejects.toThrow('Unexpected token < in JSON');
  });

  test('should handle API endpoint not found', async () => {
    // Arrange
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({})
    });

    // Act & Assert
    await expect(apiClient.request('/non-existent-endpoint')).rejects.toThrow('HTTP error! status: 404');
  });
});