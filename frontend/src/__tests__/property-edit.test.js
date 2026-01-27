// Property Editing Component Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PropertyEditPage from '../app/property/[id]/edit/page';
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

describe('Property Edit Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      back: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.getProperty.mockClear();
    apiClient.updateProperty.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  test('should fetch and display property data for editing', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      boundaryCoordinates: [{ lat: 1, lng: 1 }]
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    // Render the component
    render(<PropertyEditPage />);

    // Wait for property data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Check that property data is displayed in the form
    expect(screen.getByDisplayValue(mockProperty.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProperty.description)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProperty.address)).toBeInTheDocument();
    expect(screen.getByDisplayValue(String(mockProperty.areaInSqFt))).toBeInTheDocument();
  });

  test('should update property successfully', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      boundaryCoordinates: [{ lat: 1, lng: 1 }]
    };

    const updatedPropertyData = {
      title: 'Updated Property',
      description: 'Updated Description',
      address: 'Updated Address',
      areaInSqFt: 2000
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    apiClient.updateProperty.mockResolvedValue({
      success: true,
      message: 'Property updated successfully',
      data: { ...mockProperty, ...updatedPropertyData }
    });

    // Render the component
    render(<PropertyEditPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: updatedPropertyData.title } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: updatedPropertyData.description } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: updatedPropertyData.address } });
    fireEvent.change(screen.getByLabelText(/area in square feet/i), { target: { value: updatedPropertyData.areaInSqFt } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update property/i }));

    // Wait for update to complete
    await waitFor(() => {
      expect(apiClient.updateProperty).toHaveBeenCalledWith('mock-property-id', updatedPropertyData);
    });

    // Check that user is redirected to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  test('should handle property update errors', async () => {
    // Arrange
    const mockProperty = {
      _id: 'mock-property-id',
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: 1000,
      geotaggedImagesUrls: ['http://example.com/image1.jpg'],
      boundaryCoordinates: [{ lat: 1, lng: 1 }]
    };

    const updatedPropertyData = {
      title: 'Updated Property',
      description: 'Updated Description',
      address: 'Updated Address',
      areaInSqFt: 2000
    };

    apiClient.getProperty.mockResolvedValue({
      success: true,
      data: mockProperty
    });

    const mockError = new Error('Property update failed');
    apiClient.updateProperty.mockRejectedValue(mockError);

    // Render the component
    render(<PropertyEditPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(apiClient.getProperty).toHaveBeenCalledWith('mock-property-id');
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: updatedPropertyData.title } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: updatedPropertyData.description } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: updatedPropertyData.address } });
    fireEvent.change(screen.getByLabelText(/area in square feet/i), { target: { value: updatedPropertyData.areaInSqFt } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update property/i }));

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/property update failed/i)).toBeInTheDocument();
    });
  });
});