'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EnhancedMapComponent = ({ onCoordinatesChange, initialCoordinates = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [drawnItems, setDrawnItems] = useState([]);
  const [error, setError] = useState('');
  
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);

  // Debounced search function
  const debouncedSearch = (query) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=5&addressdetails=1`
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const results = await response.json();
        setSearchResults(results);
      } catch (err) {
        setError('Failed to search for location. Please try again.');
        console.error('Geocoding error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle location selection from search results
  const handleLocationSelect = (location) => {
    setSearchQuery(location.display_name);
    setSearchResults([]);
    setSelectedLocation(location);
    
    // Center the map on the selected location
    if (mapRef.current) {
      mapRef.current.flyTo([parseFloat(location.lat), parseFloat(location.lon)], 15);
    }
  };

  // Handle drawing events
  const handleCreated = (e) => {
    const layer = e.layer;
    const layerType = e.layerType;

    if (layerType === 'polygon' || layerType === 'rectangle') {
      // Extract coordinates from the drawn shape
      let coords = [];

      if (layerType === 'polygon') {
        // For polygons, get the lat/lngs and ensure they're properly formatted
        try {
          const latLngs = layer.getLatLngs();
          console.log('Raw latLngs from polygon:', latLngs); // Debug log

          if (latLngs && Array.isArray(latLngs)) {
            // Handle different possible structures
            const latLngArray = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
            console.log('LatLng array:', latLngArray); // Debug log

            coords = latLngArray.map(latlng => {
              const lat = parseFloat(latlng.lat);
              const lng = parseFloat(latlng.lng);
              console.log(`Processing coordinate: lat=${lat}, lng=${lng}`); // Debug log
              return {
                lat: lat,
                lng: lng
              };
            });
          } else if (latLngs && latLngs[0] && Array.isArray(latLngs[0])) {
            coords = latLngs[0].map(latlng => {
              const lat = parseFloat(latlng.lat);
              const lng = parseFloat(latlng.lng);
              console.log(`Processing coordinate: lat=${lat}, lng=${lng}`); // Debug log
              return {
                lat: lat,
                lng: lng
              };
            });
          }
        } catch (error) {
          console.error('Error extracting polygon coordinates:', error);
        }
      } else if (layerType === 'rectangle') {
        // Convert rectangle bounds to polygon coordinates
        try {
          const bounds = layer.getBounds();
          console.log('Bounds from rectangle:', bounds); // Debug log

          if (bounds) {
            coords = [
              { lat: parseFloat(bounds.getNorthEast().lat), lng: parseFloat(bounds.getNorthEast().lng) },
              { lat: parseFloat(bounds.getSouthEast().lat), lng: parseFloat(bounds.getSouthEast().lng) },
              { lat: parseFloat(bounds.getSouthWest().lat), lng: parseFloat(bounds.getSouthWest().lng) },
              { lat: parseFloat(bounds.getNorthWest().lat), lng: parseFloat(bounds.getNorthWest().lng) },
              { lat: parseFloat(bounds.getNorthEast().lat), lng: parseFloat(bounds.getNorthEast().lng) } // Close the polygon
            ];
          }
        } catch (error) {
          console.error('Error extracting rectangle coordinates:', error);
        }
      }

      // Validate coordinates before sending to satellite service
      const validCoords = coords.filter(coord =>
        coord &&
        typeof coord.lat === 'number' &&
        typeof coord.lng === 'number' &&
        !isNaN(coord.lat) &&
        !isNaN(coord.lng) &&
        isFinite(coord.lat) &&
        isFinite(coord.lng)
      );

      console.log('Valid coordinates extracted:', validCoords); // Debug log

      if (validCoords.length >= 3) { // Need at least 3 points for a polygon
        // Format coordinates for satellite service [lng, lat]
        const formattedCoords = validCoords.map(coord => [coord.lng, coord.lat]);
        console.log('Formatted coordinates for satellite service:', formattedCoords); // Debug log

        // Final validation before sending to parent
        const finalCoords = formattedCoords.filter(coord =>
          Array.isArray(coord) &&
          coord.length === 2 &&
          typeof coord[0] === 'number' &&
          typeof coord[1] === 'number' &&
          !isNaN(coord[0]) &&
          !isNaN(coord[1]) &&
          isFinite(coord[0]) &&
          isFinite(coord[1])
        );

        console.log('Final coordinates to send:', finalCoords); // Debug log

        // Update state and notify parent component
        setDrawnItems(prev => [...prev, { type: layerType, coordinates: validCoords, layer }]);
        onCoordinatesChange(finalCoords);
      } else {
        console.error('Invalid coordinates extracted from drawing', coords);
        onCoordinatesChange([]);
      }
    }
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    layers.eachLayer(layer => {
      let coords = [];

      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        if (layer instanceof L.Polygon) {
          // For polygons, get the lat/lngs and ensure they're properly formatted
          try {
            const latLngs = layer.getLatLngs();
            console.log('Raw latLngs from edited polygon:', latLngs); // Debug log

            if (latLngs && Array.isArray(latLngs)) {
              // Handle different possible structures
              const latLngArray = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;

              coords = latLngArray.map(latlng => {
                const lat = parseFloat(latlng.lat);
                const lng = parseFloat(latlng.lng);
                console.log(`Processing edited coordinate: lat=${lat}, lng=${lng}`); // Debug log
                return {
                  lat: lat,
                  lng: lng
                };
              });
            } else if (latLngs && latLngs[0] && Array.isArray(latLngs[0])) {
              coords = latLngs[0].map(latlng => {
                const lat = parseFloat(latlng.lat);
                const lng = parseFloat(latlng.lng);
                console.log(`Processing edited coordinate: lat=${lat}, lng=${lng}`); // Debug log
                return {
                  lat: lat,
                  lng: lng
                };
              });
            }
          } catch (error) {
            console.error('Error extracting edited polygon coordinates:', error);
          }
        } else if (layer instanceof L.Rectangle) {
          try {
            const bounds = layer.getBounds();
            console.log('Bounds from edited rectangle:', bounds); // Debug log

            if (bounds) {
              coords = [
                { lat: parseFloat(bounds.getNorthEast().lat), lng: parseFloat(bounds.getNorthEast().lng) },
                { lat: parseFloat(bounds.getSouthEast().lat), lng: parseFloat(bounds.getSouthEast().lng) },
                { lat: parseFloat(bounds.getSouthWest().lat), lng: parseFloat(bounds.getSouthWest().lng) },
                { lat: parseFloat(bounds.getNorthWest().lat), lng: parseFloat(bounds.getNorthWest().lng) },
                { lat: parseFloat(bounds.getNorthEast().lat), lng: parseFloat(bounds.getNorthEast().lng) }
              ];
            }
          } catch (error) {
            console.error('Error extracting edited rectangle coordinates:', error);
          }
        }

        // Validate coordinates before sending to satellite service
        const validCoords = coords.filter(coord =>
          coord &&
          typeof coord.lat === 'number' &&
          typeof coord.lng === 'number' &&
          !isNaN(coord.lat) &&
          !isNaN(coord.lng) &&
          isFinite(coord.lat) &&
          isFinite(coord.lng)
        );

        console.log('Valid coordinates from edited shape:', validCoords); // Debug log

        if (validCoords.length >= 3) { // Need at least 3 points for a polygon
          // Format coordinates for satellite service [lng, lat]
          const formattedCoords = validCoords.map(coord => [coord.lng, coord.lat]);
          console.log('Formatted coordinates for edited shape:', formattedCoords); // Debug log

          // Final validation before sending to parent
          const finalCoords = formattedCoords.filter(coord =>
            Array.isArray(coord) &&
            coord.length === 2 &&
            typeof coord[0] === 'number' &&
            typeof coord[1] === 'number' &&
            !isNaN(coord[0]) &&
            !isNaN(coord[1]) &&
            isFinite(coord[0]) &&
            isFinite(coord[1])
          );

          console.log('Final coordinates to send:', finalCoords); // Debug log

          // Notify parent component
          onCoordinatesChange(finalCoords);
        } else {
          console.error('Invalid coordinates extracted from edited shape', coords);
          onCoordinatesChange([]);
        }
      }
    });
  };

  const handleDeleted = (e) => {
    // When a shape is deleted, clear the coordinates
    setDrawnItems(prev => prev.filter(item => !e.layers.hasLayer(item.layer)));
    onCoordinatesChange([]); // Clear coordinates when shape is deleted
  };

  // Set initial coordinates if provided
  useEffect(() => {
    if (initialCoordinates && initialCoordinates.length > 0) {
      // Convert from [lng, lat] format back to {lat, lng} for internal use
      const convertedCoords = initialCoordinates.map(coord => {
        if (Array.isArray(coord) && coord.length === 2) {
          const lat = parseFloat(coord[1]);
          const lng = parseFloat(coord[0]);

          // Validate the parsed coordinates
          if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
            return {
              lat: lat,
              lng: lng
            };
          }
        }
        return null;
      }).filter(coord => coord !== null);

      if (convertedCoords.length >= 3) {
        setDrawnItems([{ type: 'polygon', coordinates: convertedCoords }]);
      }
    }
  }, [initialCoordinates]);

  return (
    <div className="enhanced-map-component">
      <div className="search-container" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search for a landmark, address, or location..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        
        {isLoading && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            Searching...
          </div>
        )}
        
        {error && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#d32f2f' }}>
            {error}
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div 
            className="search-results"
            style={{
              position: 'absolute',
              zIndex: 1000,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              width: 'calc(100% - 2rem)',
              marginTop: '0.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleLocationSelect(result)}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                  fontSize: '0.9rem'
                }}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
              >
                {result.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div 
        className="map-wrapper" 
        style={{ 
          height: '400px', 
          width: '100%', 
          borderRadius: '8px',
          border: '1px solid #ddd',
          position: 'relative'
        }}
      >
        <MapContainer
          center={[20.5937, 78.9629]} // Center of India
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                polyline: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polygon: true,
                rectangle: true
              }}
              edit={{
                edit: true,
                remove: true
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
          <li>Search for a landmark near your property</li>
          <li>Click on the location in the search results to center the map</li>
          <li>Use the drawing tools to outline your property boundaries</li>
          <li>Coordinates will be automatically captured when you finish drawing</li>
        </ol>
      </div>

      {drawnItems.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h4>Drawing Information:</h4>
          <p>Shapes drawn: {drawnItems.length}</p>
          <p>Coordinates format: [longitude, latitude] for satellite verification</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedMapComponent;