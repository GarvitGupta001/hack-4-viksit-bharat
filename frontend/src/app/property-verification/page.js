'use client';

import { motion } from "framer-motion";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

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
            <div className="auth-container" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
                {profile && profile.verified && (
                    <div className="info-message" style={{ maxWidth: '440px', width: '100%' }}>
                        Your identity is already verified. Redirecting to
                        dashboard...
                    </div>
                )}
                {profile &&
                !profile.verified &&
                profile.sellerProfile.aadharUrl &&
                profile.sellerProfile.selfieUrl ? (
                    <div className="info-message" style={{ maxWidth: '440px', width: '100%' }}>
                        Your documents are under review. Please wait for
                        verification.
                    </div>
                ) : (
                  <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                  className="surface-elevated"
                  style={{
                    width: "100%",
                    maxWidth: "460px",
                    padding: "2.2rem",
                    borderRadius: "1.25rem",
                    background: "#ffffff",
                    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <h1
                    style={{
                      textAlign: "center",
                      marginBottom: "0.5rem",
                      color: "#0f172a",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                    }}
                  >
                    Identity Verification
                  </h1>
                
                  <p
                    style={{
                      textAlign: "center",
                      marginBottom: "1.8rem",
                      fontSize: "0.95rem",
                      color: "#475569",
                    }}
                  >
                    Upload Aadhaar and a selfie to complete your verification
                  </p>
                
                  {error && (
                    <div
                      style={{
                        padding: "0.8rem 1rem",
                        marginBottom: "1.2rem",
                        borderRadius: "0.75rem",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#b91c1c",
                        fontSize: "0.9rem",
                      }}
                    >
                      {error}
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
                
                  <div style={{ marginBottom: "1.6rem" }}>
                    {/* Aadhaar Upload */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.4rem",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "#0f172a",
                        }}
                      >
                        Aadhaar Image (jpg/png)
                      </label>
                
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleImageChange(
                            e,
                            setAadhaarImage,
                            setPreviewAadhaar,
                            "Aadhaar"
                          )
                        }
                        disabled={isLoading}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "0.9rem",
                          border: "1px dashed rgba(15, 23, 42, 0.25)",
                          background: "#f8fafc",
                          color: "#0f172a",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                        }}
                      />
                
                      {previewAadhaar && (
                        <div style={{ marginTop: "0.9rem" }}>
                          <img
                            src={previewAadhaar}
                            alt="Aadhaar Preview"
                            style={{
                              width: "100%",
                              borderRadius: "0.9rem",
                              border: "1px solid rgba(15, 23, 42, 0.1)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                
                    {/* Selfie Upload */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.4rem",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "#0f172a",
                        }}
                      >
                        Selfie Image (jpg/png)
                      </label>
                
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleImageChange(
                            e,
                            setSelfieImage,
                            setPreviewSelfie,
                            "Selfie"
                          )
                        }
                        disabled={isLoading}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "0.9rem",
                          border: "1px dashed rgba(15, 23, 42, 0.25)",
                          background: "#f8fafc",
                          color: "#0f172a",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                        }}
                      />
                
                      {previewSelfie && (
                        <div style={{ marginTop: "0.9rem" }}>
                          <img
                            src={previewSelfie}
                            alt="Selfie Preview"
                            style={{
                              width: "100%",
                              borderRadius: "0.9rem",
                              border: "1px solid rgba(15, 23, 42, 0.1)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                
                  <button
                    onClick={handleVerify}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1.25rem",
                      borderRadius: "0.9rem",
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: "#ffffff",
                      background: "linear-gradient(90deg, #10B981, #16A34A)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? "Processing…" : "Verify Now"}
                  </button>
                
                  <p
                    style={{
                      marginTop: "1.2rem",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    🔒 Enterprise-grade encryption · AI-powered document validation
                  </p>
                </motion.div>                
                )}
            </div>
        </main>

        <Footer />
    </div>
);
};

export default PropertyVerificationPage;