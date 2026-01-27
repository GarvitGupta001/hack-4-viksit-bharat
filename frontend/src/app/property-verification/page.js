'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import apiClient from '../../services/api';

const PropertyVerificationPage = () => {
  const [formData, setFormData] = useState({
    propertyDocument: null,
    images: [],
    boundaryCoordinates: '',
    areaInHectares: ''
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'areaInHectares') {
      setFormData({
        ...formData,
        [name]: value
      });
    } else if (name === 'boundaryCoordinates') {
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
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (name === 'propertyDocument') {
      if (files && files[0]) {
        // Validate PDF file
        if (files[0].type !== 'application/pdf') {
          setErrors({
            ...errors,
            propertyDocument: 'Only PDF files are allowed'
          });
          return;
        }

        setFormData({
          ...formData,
          propertyDocument: files[0]
        });

        // Clear error when user selects a file
        if (errors.propertyDocument) {
          setErrors({
            ...errors,
            propertyDocument: ''
          });
        }
      }
    } else if (name === 'images') {
      const selectedFiles = Array.from(files);

      // Validate image files
      const validFiles = selectedFiles.filter(file =>
        file.type.match('image/jpeg') || file.type.match('image/png')
      );

      if (validFiles.length !== selectedFiles.length) {
        setErrors({
          ...errors,
          images: 'Only JPG and PNG files are allowed'
        });
      }

      // Add valid files to state
      setFormData({
        ...formData,
        images: [...formData.images, ...validFiles]
      });

      // Create previews for valid files
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });

      // Clear error when user selects files
      if (errors.images) {
        setErrors({
          ...errors,
          images: ''
        });
      }
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({
      ...formData,
      images: newImages
    });

    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.propertyDocument) {
      newErrors.propertyDocument = 'Property document is required';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    if (!formData.boundaryCoordinates.trim()) {
      newErrors.boundaryCoordinates = 'Boundary coordinates are required';
    } else {
      try {
        const parsedCoords = JSON.parse(formData.boundaryCoordinates);
        if (!Array.isArray(parsedCoords)) {
          newErrors.boundaryCoordinates = 'Coordinates must be in JSON array format';
        } else if (parsedCoords.length < 3) {
          newErrors.boundaryCoordinates = 'At least 3 coordinate pairs are required to form a polygon';
        } else {
          // Validate each coordinate pair
          for (const coord of parsedCoords) {
            if (!Array.isArray(coord) || coord.length !== 2 ||
                typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
              newErrors.boundaryCoordinates = 'Each coordinate must be in [longitude, latitude] format';
              break;
            }
          }
        }
      } catch (e) {
        newErrors.boundaryCoordinates = 'Invalid JSON format for coordinates';
      }
    }

    if (!formData.areaInHectares || isNaN(formData.areaInHectares) || parseFloat(formData.areaInHectares) <= 0) {
      newErrors.areaInHectares = 'Valid area in hectares is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate verification process with 2-second delay
    setTimeout(async () => {
      try {
        // Update carbon coins and property status in localStorage
        localStorage.setItem('carbonCoins', '150'); // Sample number of credits
        localStorage.setItem('propertyStatus', 'Verified'); // Set property status as verified

        // Redirect to dashboard
        setIsVerified(true);
        router.push('/dashboard');
      } catch (error) {
        console.error('Verification error:', error);
        setErrors({ api: error.message || 'Verification failed. Please try again.' });
        setIsLoading(false);
      }
    }, 2000);
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

            <div className="dashboard-content">
              <div className="step-content">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2e7d32' }}>Asset Information</h2>

                {errors.api && (
                  <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {errors.api}
                  </div>
                )}

                <div className="form-group">
                  <label style={{color:"white"}} htmlFor="propertyDocument">Property Document (PDF) *</label>
                  <input
                    type="file"
                    id="propertyDocument"
                    name="propertyDocument"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className={errors.propertyDocument ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.propertyDocument && <span className="error-message">{errors.propertyDocument}</span>}
                </div>

                <div className="form-group">
                  <label style={{color:"white"}} htmlFor="images">Property Images (Geotagged) *</label>
                  <input
                    type="file"
                    id="images"
                    name="images"
                    accept=".jpg,.jpeg,.png"
                    multiple
                    onChange={handleFileChange}
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

                <div className="form-group">
                  <label style={{color:"white"}} htmlFor="boundaryCoordinates">Boundary Coordinates (JSON Array) *</label>
                  <textarea
                    id="boundaryCoordinates"
                    name="boundaryCoordinates"
                    value={formData.boundaryCoordinates}
                    onChange={handleInputChange}
                    className={errors.boundaryCoordinates ? 'error' : ''}
                    placeholder={`Enter coordinates as a JSON array of [longitude, latitude] pairs\nExample: [[77.185, 28.565], [77.200, 28.565], [77.200, 28.575], [77.185, 28.575]]\nAt least 3 coordinate pairs are required to form a polygon`}
                    rows="6"
                    disabled={isLoading}
                  ></textarea>
                  {errors.boundaryCoordinates && <span className="error-message">{errors.boundaryCoordinates}</span>}
                </div>

                <div className="form-group">
                  <label style={{color:"white"}} htmlFor="areaInHectares">Area of Land (Hectares) *</label>
                  <input
                    type="number"
                    id="areaInHectares"
                    name="areaInHectares"
                    value={formData.areaInHectares}
                    onChange={handleInputChange}
                    className={errors.areaInHectares ? 'error' : ''}
                    placeholder="Enter area in hectares"
                    min="0.01"
                    step="0.01"
                    disabled={isLoading}
                  />
                  {errors.areaInHectares && <span className="error-message">{errors.areaInHectares}</span>}
                </div>
              </div>

              <div className="step-navigation" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                  onClick={handleSubmit}
                  className="action-button primary"
                  disabled={isLoading}
                  style={{ minWidth: '200px', marginTop:"-2rem" }}
                >
                  {isLoading ? 'Verifying...' : 'Submit for Verification'}
                </button>
              </div>

              <div className="dashboard-actions" style={{ fontSize: "1rem", marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link style={{marginBottom: "3rem"}} href="/dashboard" className="action-button secondary">
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

export default PropertyVerificationPage;