// Property Deletion Component Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PropertyDeletePage from '../app/property/[id]/delete/page';
import apiClient from '../../../services/api';

// Mock the API client
jest.mock('../../../services/api');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({ id: 'mock-property-id' })),
}));

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

describe('Property Delete Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      back: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.getProperty.mockClear();
    apiClient.deleteProperty.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  test('should fetch and display property data for confirmation', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      SellerId: { name: 'Test Seller' }
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    // Render the component
    render(<PropertyDeletePage />);

    // Wait for property data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Check that property data is displayed for confirmation
    expect(screen.getByText(/test property/i)).toBeInTheDocument();
    expect(screen.getByText(/test description/i)).toBeInTheDocument();
    expect(screen.getByText(/test seller/i)).toBeInTheDocument();
  });

  test('should delete property successfully', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      SellerId: { name: 'Test Seller' }
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    apiClient.deleteProperty.mockResolvedValue({
      success: true,
      message: 'Property deleted successfully'
    });

    // Render the component
    render(<PropertyDeletePage />);

    // Wait for property data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /yes, delete property/i }));

    // Wait for deletion to complete
    await waitFor(() => {
      expect(apiClient.deleteProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Check that user is redirected to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  test('should cancel deletion and go back', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      SellerId: { name: 'Test Seller' }
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    // Render the component
    render(<PropertyDeletePage />);

    // Wait for property data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Cancel deletion
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Check that user is redirected back to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  test('should handle property deletion errors', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      SellerId: { name: 'Test Seller' }
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    const mockError = new Error('Property deletion failed');
    apiClient.deleteProperty.mockRejectedValue(mockError);

    // Render the component
    render(<PropertyDeletePage />);

    // Wait for property data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /yes, delete property/i }));

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/property deletion failed/i)).toBeInTheDocument();
    });
  });
});