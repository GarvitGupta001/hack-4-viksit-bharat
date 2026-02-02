'use client';

import { motion } from 'framer-motion';
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
      // alert(`Property created successfully! You earned ${response.data.coinsEarned} carbon coins!`);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Property creation error:', error);
      setErrors({ api: error.message || 'Property creation failed. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ background: '#f8fafc' }}>
      <Navbar />
  
      <main className="main-content">
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div className="dashboard-container" style={{ maxWidth: '1040px' }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              className="dashboard-header"
              style={{ textAlign: 'left', marginBottom: '2rem' }}
            >
              <h1
                className="dashboard-title"
                style={{
                  fontSize: 'clamp(2.2rem, 4vw, 2.8rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                }}
              >
                Property Verification
              </h1>
              <p className="dashboard-subtitle" style={{ color: '#64748b', marginBottom: '1.25rem' }}>
                Register and verify your green assets with a structured, step-by-step flow.
              </p>
              <div style={{ borderBottom: '1px solid #e2e8f0' }} />
            </motion.div>
  
            {/* Process visualization (purely visual) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="progress-indicator"
              style={{
                marginBottom: '2.5rem',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                padding: '1.25rem 1.5rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', alignItems: 'center' }}>
                {[
                  { s: 1, label: 'Register Property' },
                  { s: 2, label: 'Upload Details' },
                  { s: 3, label: 'Satellite Verification' },
                ].map(({ s, label }, idx) => {
                  const active = step >= s;
                  const current = step === s;
  
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: active ? '#0f172a' : '#64748b',
                          background: active ? '#f0fdfa' : '#f8fafc',
                          border: `1px solid ${active ? '#99f6e4' : '#e2e8f0'}`,
                          boxShadow: current ? '0 10px 30px rgba(15,23,42,0.06)' : 'none',
                        }}
                      >
                        {s}
                      </div>
  
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: current ? 700 : 600,
                            letterSpacing: '-0.01em',
                            color: current ? '#0f172a' : '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {label}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Step {s}
                        </div>
                      </div>
  
                      {idx < 2 && (
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            right: '-0.375rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '0.75rem',
                            height: 2,
                            background: '#e2e8f0',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
  
            <div className="dashboard-content">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="step-content">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                    style={{ textAlign: 'left', marginBottom: '2rem' }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#0f172a',
                      }}
                    >
                      Asset Information
                    </h2>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#64748b' }}>
                      Provide accurate property details and boundary coordinates for satellite verification.
                    </p>
                  </motion.div>
  
                  {errors.api && (
                    <div
                      className="error-message"
                      style={{
                        marginBottom: '1rem',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid #fecaca',
                        fontSize: '0.9rem',
                      }}
                    >
                      {errors.api}
                    </div>
                  )}
  
                  {/* A. Property Basic Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 0.61, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="verification-step"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                      padding: '2rem',
                      marginBottom: '2.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
                      Property Basic Details
                    </div>
  
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label htmlFor="title" style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                        Property Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={errors.title ? 'error' : ''}
                        placeholder="e.g., 500 Mango Trees Farm"
                        disabled={isLoading}
                        style={{
                          height: 52,
                          padding: '0 16px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          width: '100%',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#0f766e';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      {errors.title && (
                        <span
                          className="error-message"
                          style={{
                            display: 'block',
                            marginTop: '0.5rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {errors.title}
                        </span>
                      )}
                    </div>
  
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="description" style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={errors.description ? 'error' : ''}
                        placeholder="Describe your green asset and its environmental benefits..."
                        rows="4"
                        disabled={isLoading}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          width: '100%',
                          outline: 'none',
                          lineHeight: 1.6,
                          resize: 'vertical',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#0f766e';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      ></textarea>
                      {errors.description && (
                        <span
                          className="error-message"
                          style={{
                            display: 'block',
                            marginTop: '0.5rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {errors.description}
                        </span>
                      )}
                    </div>
                  </motion.div>
  
                  {/* B. Location Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="verification-step"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                      padding: '2rem',
                      marginBottom: '2.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
                      Location Information
                    </div>
  
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label htmlFor="address" style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                        Address *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={errors.address ? 'error' : ''}
                        placeholder="Full address of the property"
                        disabled={isLoading}
                        style={{
                          height: 52,
                          padding: '0 16px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          width: '100%',
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#0f766e';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      {errors.address && (
                        <span
                          className="error-message"
                          style={{
                            display: 'block',
                            marginTop: '0.5rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {errors.address}
                        </span>
                      )}
                    </div>
  
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="areaInSqFt" style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                        Area in Square Feet *
                      </label>
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
                        style={{
                          height: 52,
                          padding: '0 16px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          width: '100%',
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#0f766e';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      {errors.areaInSqFt && (
                        <span
                          className="error-message"
                          style={{
                            display: 'block',
                            marginTop: '0.5rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {errors.areaInSqFt}
                        </span>
                      )}
                    </div>
                  </motion.div>
  
                  {/* C. Boundary Coordinates / Map */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="verification-step"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                      padding: '2rem',
                      marginBottom: '2.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
                      Boundary Coordinates / Map
                    </div>
  
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="boundaryCoordinates" style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                        Boundary Coordinates *
                      </label>
                      <textarea
                        id="boundaryCoordinates"
                        name="boundaryCoordinates"
                        value={
                          formData.boundaryCoordinates &&
                          Array.isArray(formData.boundaryCoordinates) &&
                          formData.boundaryCoordinates.length > 0
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
  
                              setFormData(prev => ({ ...prev, boundaryCoordinates: convertedCoords }));
                              // Clear any error for this field
                              setErrors(prev => ({ ...prev, boundaryCoordinates: '' }));
                            } else {
                              setErrors(prev => ({ ...prev, boundaryCoordinates: 'Must be an array of coordinate pairs' }));
                            }
                          } catch (error) {
                            setErrors(prev => ({ ...prev, boundaryCoordinates: 'Invalid coordinate format. Use [[lng, lat], [lng, lat], ...] format' }));
                          }
                        }}
                        placeholder='Enter coordinates in format: [[77.1950, 28.5050], [77.1965, 28.5050], ...]'
                        rows="6"
                        disabled={isLoading}
                        required
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          width: '100%',
                          outline: 'none',
                          lineHeight: 1.6,
                          resize: 'vertical',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#0f766e';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      ></textarea>
  
                      <small style={{ color: '#64748b', marginTop: '0.75rem', display: 'block' }}>
                        Enter coordinates in <strong>[longitude, latitude]</strong> format. Example: <strong>[[77.1950, 28.5050], [77.1965, 28.5050], ...]</strong>
                      </small>
  
                      {errors.boundaryCoordinates && (
                        <span
                          className="error-message"
                          style={{
                            display: 'block',
                            marginTop: '0.75rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {errors.boundaryCoordinates}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
  
              {/* STEP 2 */}
              {step === 2 && (
                <div className="step-content">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                    style={{ textAlign: 'left', marginBottom: '2rem' }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#0f172a',
                      }}
                    >
                      Documentation
                    </h2>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#64748b' }}>
                      Upload clear supporting images. You can add multiple JPG/PNG files.
                    </p>
                  </motion.div>
  
                  {errors.api && (
                    <div
                      className="error-message"
                      style={{
                        marginBottom: '1rem',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid #fecaca',
                        fontSize: '0.9rem',
                      }}
                    >
                      {errors.api}
                    </div>
                  )}
  
                  {/* D. Document Upload */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="verification-step"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                      padding: '2rem',
                      marginBottom: '2.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
                      Document Upload
                    </div>
  
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                        Upload Supporting Images *
                      </label>
  
                      <div
                        style={{
                          padding: '2rem',
                          borderRadius: '16px',
                          border: '2px dashed #cbd5e1',
                          background: '#f8fafc',
                          textAlign: 'center',
                          transition: '200ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                        }}
                      >
                        <div style={{ color: '#0f172a', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>
                          Drag & drop or click to upload
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                          JPG or PNG • multiple files supported
                        </div>
  
                        <input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png"
                          onChange={handleImageChange}
                          className={errors.images ? 'error' : ''}
                          disabled={isLoading}
                          style={{
                            width: '100%',
                            maxWidth: 520,
                            margin: '0 auto',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '0.85rem 1rem',
                            color: '#0f172a',
                          }}
                        />
                      </div>
  
                      {errors.images && (
                        <span
                          className="error-message"
                          style={{
                            display: 'block',
                            marginTop: '0.75rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {errors.images}
                        </span>
                      )}
  
                      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {previewImages.map((preview, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            whileHover={{ y: -4 }}
                            style={{
                              position: 'relative',
                              width: '150px',
                              height: '150px',
                              borderRadius: '16px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                              background: '#ffffff',
                              overflow: 'hidden',
                            }}
                          >
                            <img
                              src={preview}
                              alt={`Preview ${index}`}
                              className="preview-image"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: '#991b1b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '999px',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                                fontWeight: 700,
                                lineHeight: '28px',
                              }}
                            >
                              ×
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
  
              {/* STEP 3 */}
              {step === 3 && (
                <div className="step-content">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                    style={{ textAlign: 'left', marginBottom: '2rem' }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#0f172a',
                      }}
                    >
                      Review & Submit
                    </h2>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#64748b' }}>
                      Confirm everything looks correct before submitting.
                    </p>
                  </motion.div>
  
                  {/* E. Final Submission */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="verification-step"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                      padding: '2rem',
                      marginBottom: '2.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
                      Final Submission
                    </div>
  
                    <div
                      className="review-summary"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1.25rem',
                      }}
                    >
                      <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Property Details:
                      </h3>
                      <p style={{ color: '#0f172a' }}><strong>Title:</strong> {formData.title}</p>
                      <p style={{ color: '#0f172a' }}><strong>Description:</strong> {formData.description}</p>
                      <p style={{ color: '#0f172a' }}><strong>Address:</strong> {formData.address}</p>
                      <p style={{ color: '#0f172a' }}><strong>Area:</strong> {formData.areaInSqFt} sq ft</p>
                      <p style={{ color: '#0f172a' }}><strong>Images:</strong> {images.length} uploaded</p>
                    </div>
  
                    <div style={{ marginTop: '1.5rem' }}>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>
                        By submitting, you agree that the information provided is accurate and that you have the right to register this property.
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
  
              {/* Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                className="step-navigation"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginTop: '2rem',
                  alignItems: 'center',
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePrevious}
                  className="action-button secondary"
                  disabled={step === 1 || isLoading}
                  style={{
                    minWidth: '140px',
                    height: 52,
                    padding: '0 24px',
                    borderRadius: 14,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontWeight: 600,
                    transition: '200ms ease',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    opacity: (step === 1 || isLoading) ? 0.6 : 1,
                    cursor: (step === 1 || isLoading) ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  Previous
                </motion.button>
  
                {step < 3 ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleNext}
                    className="action-button primary"
                    disabled={isLoading}
                    style={{
                      minWidth: '140px',
                      height: 52,
                      padding: '0 24px',
                      borderRadius: 14,
                      background: '#0f766e',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      color: '#ffffff',
                      fontWeight: 600,
                      transition: '200ms ease',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#0d9488';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0f766e';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Next
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSubmit}
                    className="action-button primary"
                    disabled={isLoading}
                    style={{
                      minWidth: '180px',
                      height: 52,
                      padding: '0 24px',
                      borderRadius: 14,
                      background: '#0f766e',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      color: '#ffffff',
                      fontWeight: 600,
                      transition: '200ms ease',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#0d9488';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0f766e';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Property'}
                  </motion.button>
                )}
              </motion.div>
  
              {/* Bottom actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                className="dashboard-actions"
                style={{
                  fontSize: '1rem',
                  marginTop: '2rem',
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.22 }}>
                  <Link
                    href="/dashboard"
                    className="action-button secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 52,
                      padding: '0 24px',
                      borderRadius: 14,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a',
                      fontWeight: 600,
                      boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                      textDecoration: 'none',
                    }}
                  >
                    Back to Dashboard
                  </Link>
                </motion.div>
  
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.22 }}>
                  <Link
                    href="/property-verification/enhanced"
                    className="action-button primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 52,
                      padding: '0 24px',
                      borderRadius: 14,
                      background: '#0f766e',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      color: '#ffffff',
                      fontWeight: 600,
                      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0d9488';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0f766e';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Enhanced Verification (with Map)
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
  
      <Footer />
    </div>
  );
};

export default PropertyVerificationPage;