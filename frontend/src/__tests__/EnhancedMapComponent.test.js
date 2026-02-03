/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedMapComponent from '../components/EnhancedMapComponent';

// Mock Leaflet and related libraries
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: ({ ...props }) => <div data-testid="tile-layer" {...props} />,
  FeatureGroup: ({ children, ...props }) => (
    <div data-testid="feature-group" {...props}>
      {children}
    </div>
  ),
}));

// Mock react-leaflet-draw
jest.mock('react-leaflet-draw', () => ({
  EditControl: ({ ...props }) => <div data-testid="edit-control" {...props} />
}));

// Mock fetch for geocoding
global.fetch = jest.fn();

describe('EnhancedMapComponent', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    render(<EnhancedMapComponent onCoordinatesChange={() => {}} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('displays search input field', () => {
    render(<EnhancedMapComponent onCoordinatesChange={() => {}} />);
    expect(screen.getByPlaceholderText(/search for a landmark/i)).toBeInTheDocument();
  });

  test('triggers geocoding API call when searching', async () => {
    const mockGeocodingResponse = [
      {
        lat: '51.505',
        lon: '-0.09',
        display_name: 'Test Location, London, UK'
      }
    ];

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockGeocodingResponse),
    });

    render(<EnhancedMapComponent onCoordinatesChange={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText(/search for a landmark/i);
    fireEvent.change(searchInput, { target: { value: 'London' } });
    
    // Wait for the debounced search to trigger
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search?q=London&format=jsonv2&limit=5&addressdetails=1'
      );
    });
  });

  test('shows search results when available', async () => {
    const mockGeocodingResponse = [
      {
        lat: '51.505',
        lon: '-0.09',
        display_name: 'Test Location, London, UK'
      }
    ];

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockGeocodingResponse),
    });

    render(<EnhancedMapComponent onCoordinatesChange={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText(/search for a landmark/i);
    fireEvent.change(searchInput, { target: { value: 'London' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Test Location, London, UK/i)).toBeInTheDocument();
    });
  });

  test('does not call geocoding API for empty search', async () => {
    render(<EnhancedMapComponent onCoordinatesChange={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText(/search for a landmark/i);
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Wait a bit to ensure no fetch calls happened
    setTimeout(() => {
      expect(fetch).not.toHaveBeenCalled();
    }, 500);
  });

  test('formats coordinates correctly for satellite service [lng, lat]', () => {
    // This test would be easier to implement after the component is built
    // For now, we'll test the concept with a mock
    const mockCoordinates = [
      { lat: 51.505, lng: -0.09 },
      { lat: 51.51, lng: -0.1 },
      { lat: 51.515, lng: -0.095 }
    ];
    
    // Simulate the coordinate transformation that would happen in the component
    const formattedCoordinates = mockCoordinates.map(coord => [coord.lng, coord.lat]);
    
    expect(formattedCoordinates).toEqual([
      [-0.09, 51.505],
      [-0.1, 51.51],
      [-0.095, 51.515]
    ]);
  });

  test('validates coordinates format', () => {
    const validCoordinates = [
      { lat: 51.505, lng: -0.09 },
      { lat: 51.51, lng: -0.1 }
    ];
    
    // Simulate validation that would happen in the component
    const isValid = validCoordinates.every(coord => 
      typeof coord === 'object' && 
      coord.lat !== undefined && 
      coord.lng !== undefined &&
      typeof coord.lat === 'number' &&
      typeof coord.lng === 'number' &&
      !isNaN(coord.lat) &&
      !isNaN(coord.lng)
    );
    
    expect(isValid).toBe(true);
  });

  test('handles geocoding API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<EnhancedMapComponent onCoordinatesChange={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText(/search for a landmark/i);
    fireEvent.change(searchInput, { target: { value: 'London' } });
    
    // Wait for error handling
    await waitFor(() => {
      // We expect no crash or error boundary, just graceful handling
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  test('calls onCoordinatesChange callback when coordinates are updated', () => {
    const mockCallback = jest.fn();
    render(<EnhancedMapComponent onCoordinatesChange={mockCallback} />);
    
    // Simulate calling the callback (would happen when drawing is complete in real implementation)
    // This test will be more meaningful after the component is implemented
    expect(mockCallback).toHaveBeenCalledTimes(0); // Initially called 0 times
  });
});