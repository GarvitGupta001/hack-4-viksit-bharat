'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const PropertyVerificationPage = () => {
  const [step, setStep] = useState(1); // Track current step
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    areaInSqFt: '',
    boundaryCoordinates: [] // Will be an array of {lat, lng} objects
  });
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = files.filter(file => 
      file.type.match('image/jpeg') || file.type.match('image/png')
    );

    if (validFiles.length !== files.length) {
      setErrors({
        ...errors,
        images: 'Only JPG and PNG files are allowed'
      });
    }

    // Add valid files to state
    setImages(prev => [...prev, ...validFiles]);

    // Create previews for valid files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.areaInSqFt || isNaN(formData.areaInSqFt) || parseFloat(formData.areaInSqFt) <= 0) {
      newErrors.areaInSqFt = 'Valid area in sq ft is required';
    }

    // Validate boundary coordinates - they are required for satellite verification
    if (!formData.boundaryCoordinates || !Array.isArray(formData.boundaryCoordinates) || formData.boundaryCoordinates.length === 0) {
      newErrors.boundaryCoordinates = 'Boundary coordinates are required for satellite verification';
    } else {
      const isValid = formData.boundaryCoordinates.every(coord =>
        typeof coord === 'object' &&
        coord.lat !== undefined &&
        coord.lng !== undefined &&
        typeof coord.lat === 'number' &&
        typeof coord.lng === 'number' &&
        !isNaN(coord.lat) &&
        !isNaN(coord.lng)
      );

      if (!isValid) {
        newErrors.boundaryCoordinates = 'Each coordinate must have valid lat and lng numbers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (images.length === 0) {
      setErrors({ images: 'At least one image is required' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare property data
      const propertyData = {
        ...formData,
        areaInSqFt: parseFloat(formData.areaInSqFt),
        boundaryCoordinates: formData.boundaryCoordinates // This would typically come from a map interface
      };

      // Call API to create property
      const response = await apiClient.createProperty(propertyData, images);

      // Show success message
      alert(`Property created successfully! You earned ${response.data.coinsEarned} carbon coins!`);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Property creation error:', error);
      setErrors({ api: error.message || 'Property creation failed. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title" style={{fontSize: "3rem"}}>Property Verification</h1>
              <p className="dashboard-subtitle">Register and verify your green assets</p>
            </div>

            <div className="progress-indicator" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      backgroundColor: step >= s ? '#4caf50' : '#e0e0e0',
                      color: step >= s ? 'white' : '#757575',
                      fontWeight: 'bold'
                    }}
                  >
                    Step {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-content">
              {step === 1 && (
                <div className="step-content">
                  <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2e7d32' }}>Asset Information</h2>
                  
                  {errors.api && (
                    <div className="error-message" style={{ marginBottom: '1rem' }}>
                      {errors.api}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="title">Property Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={errors.title ? 'error' : ''}
                      placeholder="e.g., 500 Mango Trees Farm"
                      disabled={isLoading}
                    />
                    {errors.title && <span className="error-message">{errors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={errors.description ? 'error' : ''}
                      placeholder="Describe your green asset and its environmental benefits..."
                      rows="4"
                      disabled={isLoading}
                    ></textarea>
                    {errors.description && <span className="error-message">{errors.description}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={errors.address ? 'error' : ''}
                      placeholder="Full address of the property"
                      disabled={isLoading}
                    />
                    {errors.address && <span className="error-message">{errors.address}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="areaInSqFt">Area in Square Feet *</label>
                    <input
                      type="number"
                      id="areaInSqFt"
                      name="areaInSqFt"
                      value={formData.areaInSqFt}
                      onChange={handleInputChange}
                      className={errors.areaInSqFt ? 'error' : ''}
                      placeholder="Enter area in sq ft"
                      min="1"
                      disabled={isLoading}
                    />
                    {errors.areaInSqFt && <span className="error-message">{errors.areaInSqFt}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="boundaryCoordinates">Boundary Coordinates *</label>
                    <p style={{ color: '#757575', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Enter coordinates manually or <Link href="/property-verification/enhanced" className="action-button secondary" style={{ display: 'inline-block', marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>use enhanced map interface</Link>
                    </p>
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
                          // Check if it's a valid array format
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
                            // Clear any error for this field
                            setErrors(prev => ({...prev, boundaryCoordinates: ''}));
                          } else {
                            setErrors(prev => ({...prev, boundaryCoordinates: 'Must be an array of coordinate pairs'}));
                          }
                        } catch (error) {
                          setErrors(prev => ({...prev, boundaryCoordinates: 'Invalid coordinate format. Use [[lng, lat], [lng, lat], ...] format'}));
                        }
                      }}
                      placeholder='Enter coordinates in format: [[77.1950, 28.5050], [77.1965, 28.5050], ...]'
                      rows="6"
                      disabled={isLoading}
                      required
                    ></textarea>
                    <small style={{ color: '#757575', marginTop: '0.5rem', display: 'block' }}>
                      Enter coordinates in [longitude, latitude] format. Example: [[77.1950, 28.5050], [77.1965, 28.5050], ...]
                    </small>
                    {errors.boundaryCoordinates && <span className="error-message">{errors.boundaryCoordinates}</span>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2e7d32' }}>Documentation</h2>
                  
                  {errors.api && (
                    <div className="error-message" style={{ marginBottom: '1rem' }}>
                      {errors.api}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Upload Supporting Images *</label>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png"
                      onChange={handleImageChange}
                      className={errors.images ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.images && <span className="error-message">{errors.images}</span>}
                    
                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {previewImages.map((preview, index) => (
                        <div key={index} style={{ position: 'relative', width: '150px', height: '150px' }}>
                          <img 
                            src={preview} 
                            alt={`Preview ${index}`} 
                            className="preview-image" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="step-content">
                  <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2e7d32' }}>Review & Submit</h2>
                  
                  <div className="review-summary">
                    <h3>Property Details:</h3>
                    <p><strong>Title:</strong> {formData.title}</p>
                    <p><strong>Description:</strong> {formData.description}</p>
                    <p><strong>Address:</strong> {formData.address}</p>
                    <p><strong>Area:</strong> {formData.areaInSqFt} sq ft</p>
                    <p><strong>Images:</strong> {images.length} uploaded</p>
                  </div>
                  
                  <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p>By submitting, you agree that the information provided is accurate and that you have the right to register this property.</p>
                  </div>
                </div>
              )}

              <div className="step-navigation" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button
                  onClick={handlePrevious}
                  className="action-button secondary"
                  disabled={step === 1 || isLoading}
                  style={{ minWidth: '120px' }}
                >
                  Previous
                </button>

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="action-button primary"
                    disabled={isLoading}
                    style={{ minWidth: '120px' }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="action-button primary"
                    disabled={isLoading}
                    style={{ minWidth: '120px' }}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Property'}
                  </button>
                )}
              </div>

              <div className="dashboard-actions" style={{ fontSize: "1rem", marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/dashboard" className="action-button secondary">
                  Back to Dashboard
                </Link>
                <Link href="/property-verification/enhanced" className="action-button primary">
                  Enhanced Verification (with Map)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyVerificationPage;