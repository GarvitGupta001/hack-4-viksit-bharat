// Enhanced Property Verification Component Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import EnhancedPropertyVerificationPage from '../app/property-verification/enhanced/page';
import apiClient from '../../../services/api';

// Mock the API client
jest.mock('../../../services/api');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

// Mock map component
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMapEvents: () => null,
}));

describe('Enhanced Property Verification Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.createProperty.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  test('should render enhanced property verification form with map', async () => {
    // Render the component
    render(<EnhancedPropertyVerificationPage />);

    // Check that map component is rendered
    expect(screen.getByTestId('map-container')).toBeInTheDocument();

    // Check that form elements are present
    expect(screen.getByLabelText(/property title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/area in square feet/i)).toBeInTheDocument();
  });

  test('should allow user to add boundary coordinates via map', async () => {
    // Render the component
    render(<EnhancedPropertyVerificationPage />);

    // Simulate clicking on map to add coordinates
    const mapContainer = screen.getByTestId('map-container');
    fireEvent.click(mapContainer);

    // Check that coordinates were added to the form
    // This would depend on how the map interaction is implemented
  });

  test('should submit property with boundary coordinates', async () => {
    // Arrange
    const mockPropertyData = {
      title: 'Test Property',
      description: 'Test Description',
      address: 'Test Address',
      areaInSqFt: '1000',
      boundaryCoordinates: [{ lat: 1.0, lng: 1.0 }]
    };

    const mockImage = new File([''], 'test.jpg', { type: 'image/jpeg' });

    apiClient.createProperty.mockResolvedValue({
      success: true,
      message: 'Property created successfully',
      data: {
        property: { id: 'mock-property-id', ...mockPropertyData },
        coinsEarned: 10
      }
    });

    // Render the component
    render(<EnhancedPropertyVerificationPage />);

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/property title/i), { target: { value: mockPropertyData.title } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: mockPropertyData.description } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: mockPropertyData.address } });
    fireEvent.change(screen.getByLabelText(/area in square feet/i), { target: { value: mockPropertyData.areaInSqFt } });

    // Add image
    const imageInput = screen.getByLabelText('Upload Supporting Images *');
    fireEvent.change(imageInput, { target: { files: [mockImage] } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit property/i }));

    // Wait for submission to complete
    await waitFor(() => {
      expect(apiClient.createProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockPropertyData.title,
          description: mockPropertyData.description,
          address: mockPropertyData.address,
          areaInSqFt: parseFloat(mockPropertyData.areaInSqFt),
          boundaryCoordinates: mockPropertyData.boundaryCoordinates
        }),
        [mockImage]
      );
    });

    // Check that user is redirected to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});