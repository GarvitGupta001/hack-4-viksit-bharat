'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const PropertyEditPage = () => {
  const { id } = useParams(); // Get property ID from URL params
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    areaInSqFt: '',
    boundaryCoordinates: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load property data on component mount
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await apiClient.getProperty(id);
        const prop = response.data;
        setProperty(prop);
        setFormData({
          title: prop.title || '',
          description: prop.description || '',
          address: prop.address || '',
          areaInSqFt: prop.areaInSqFt || '',
          boundaryCoordinates: prop.boundaryCoordinates || []
        });
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load property');
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updatedProperty = await apiClient.updateProperty(id, formData);
      alert('Property updated successfully!');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to update property');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <p>Loading property...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <h2>Error</h2>
              <p>{error}</p>
              <Link href="/dashboard" className="action-button primary">Back to Dashboard</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">Edit Property</h1>
              <p className="dashboard-subtitle">Update your property details</p>
            </div>

            <div className="dashboard-content">
              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label htmlFor="title">Property Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="upload-input"
                    placeholder="e.g., 500 Mango Trees Farm"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="upload-input"
                    placeholder="Describe your green asset and its environmental benefits..."
                    rows="4"
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="upload-input"
                    placeholder="Full address of the property"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="areaInSqFt">Area in Square Feet</label>
                  <input
                    type="number"
                    id="areaInSqFt"
                    name="areaInSqFt"
                    value={formData.areaInSqFt}
                    onChange={handleInputChange}
                    className="upload-input"
                    placeholder="Enter area in sq ft"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="boundaryCoordinates">Boundary Coordinates *</label>
                  <textarea
                    id="boundaryCoordinates"
                    name="boundaryCoordinates"
                    value={formData.boundaryCoordinates && Array.isArray(formData.boundaryCoordinates) && formData.boundaryCoordinates.length > 0
                      ? JSON.stringify(formData.boundaryCoordinates.map(coord => [coord.lng, coord.lat]), null, 2)
                      : "[\n  [77.1950, 28.5050],\n  [77.1965, 28.5050],\n  [77.1965, 28.5065],\n  [77.1950, 28.5065],\n  [77.1950, 28.5050]\n]"
                    }
                    onChange={(e) => {
                      try {
                        const rawInput = e.target.value.trim();
                        let parsed;

                        // Try to parse as-is first
                        try {
                          parsed = JSON.parse(rawInput);
                        } catch {
                          // If that fails, try wrapping in brackets if it looks like an array of arrays
                          if (rawInput.startsWith('[') && rawInput.includes('[') && rawInput.endsWith(']')) {
                            parsed = JSON.parse(`[${rawInput.replace(/^\[|\]$/g, '')}]`);
                          } else {
                            throw new Error('Invalid format');
                          }
                        }

                        if (Array.isArray(parsed)) {
                          // Convert [lng, lat] format to {lng, lat} format
                          const convertedCoords = parsed.map(coordPair => {
                            if (Array.isArray(coordPair) && coordPair.length === 2) {
                              const [lng, lat] = coordPair;
                              return { lng: Number(lng), lat: Number(lat) };
                            } else {
                              throw new Error('Each coordinate pair must be an array with 2 numbers [lng, lat]');
                            }
                          });

                          setFormData(prev => ({...prev, boundaryCoordinates: convertedCoords}));
                        } else {
                          throw new Error('Must be an array of coordinate pairs');
                        }
                      } catch (error) {
                        // Handle error if needed
                      }
                    }}
                    placeholder='Enter coordinates in format: [[77.1950, 28.5050], [77.1965, 28.5050], ...]'
                    rows="6"
                    required
                  ></textarea>
                  <small style={{ color: '#757575', marginTop: '0.5rem', display: 'block' }}>
                    Enter coordinates in [longitude, latitude] format. Example: [[77.1950, 28.5050], [77.1965, 28.5050], ...]
                  </small>
                </div>

                <div className="dashboard-actions">
                  <button type="submit" className="action-button primary" disabled={saving}>
                    {saving ? 'Updating Property...' : 'Update Property'}
                  </button>
                  <Link href={`/property/${id}`} className="action-button secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyEditPage;