'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

// Simple map-like component since we don't have Leaflet installed
const SimpleMap = ({ onCoordinateSelect, selectedCoordinates }) => {
  const handleMapClick = (e) => {
    // In a real implementation, this would get coordinates from the map
    // For now, we'll simulate with random coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simulated)
    const lat = 20 + (y / rect.height) * 10; // Range: 20-30
    const lng = 70 + (x / rect.width) * 10;  // Range: 70-80
    
    onCoordinateSelect({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '300px', 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        backgroundColor: '#e0f7fa',
        position: 'relative',
        cursor: 'crosshair',
        overflow: 'hidden'
      }}
      onClick={handleMapClick}
    >
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, color: '#006064', fontWeight: 'bold' }}>
        Click on the map to add boundary points
      </div>
      
      {/* Grid lines for visual reference */}
      <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
      <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
      
      {/* Draw selected coordinates */}
      {selectedCoordinates.map((coord, index) => (
        <div 
          key={index}
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#f44336',
            border: '2px solid white',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
            left: `${((coord.lng - 70) / 10) * 100}%`,
            top: `${((coord.lat - 20) / 10) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
          title={`Point ${index + 1}: ${coord.lat}, ${coord.lng}`}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '1px 3px',
            borderRadius: '3px',
            whiteSpace: 'nowrap'
          }}>
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

const EnhancedPropertyVerificationPage = () => {
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

  const handleCoordinateSelect = (coordinate) => {
    setFormData(prev => ({
      ...prev,
      boundaryCoordinates: [...prev.boundaryCoordinates, coordinate]
    }));
  };

  const removeCoordinate = (index) => {
    setFormData(prev => ({
      ...prev,
      boundaryCoordinates: prev.boundaryCoordinates.filter((_, i) => i !== index)
    }));
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
        areaInSqFt: parseFloat(formData.areaInSqFt)
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
                    <label>Boundary Coordinates (Optional)</label>
                    <p style={{ color: '#757575', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Click on the map below to add boundary points for your property
                    </p>
                    <SimpleMap 
                      onCoordinateSelect={handleCoordinateSelect}
                      selectedCoordinates={formData.boundaryCoordinates}
                    />
                    
                    {formData.boundaryCoordinates.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4>Selected Coordinates:</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {formData.boundaryCoordinates.map((coord, index) => (
                            <li key={index} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '0.5rem',
                              borderBottom: '1px solid #eee'
                            }}>
                              <span>Point {index + 1}: {coord.lat}, {coord.lng}</span>
                              <button
                                type="button"
                                onClick={() => removeCoordinate(index)}
                                style={{
                                  background: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '0.25rem 0.5rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                    <p><strong>Boundary Points:</strong> {formData.boundaryCoordinates.length}</p>
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

              <div className="dashboard-actions" style={{ fontSize: "1rem", marginTop: "2rem" }}>
                <Link href="/dashboard" className="action-button secondary">
                  Back to Dashboard
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

export default EnhancedPropertyVerificationPage;