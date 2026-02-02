'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const PropertyDetailPage = () => {
  const { id } = useParams(); // Get property ID from URL params
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Load property data and current user on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user profile
        const profileResponse = await apiClient.getProfile();
        setCurrentUser(profileResponse.data);

        // Get property details
        const propertyResponse = await apiClient.getProperty(id);
        setProperty(propertyResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load property');
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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

  // Check if current user owns this property
  const isOwner = currentUser && property && currentUser._id === property.SellerId._id;

  return (
    <div className="page-container" style={{ background: '#f8fafc' }}>
      <Navbar />
      <main className="main-content">
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <motion.div
            className="dashboard-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ maxWidth: '1100px' }}
          >
            {/* Header */}
            <motion.div
              className="dashboard-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ textAlign: 'left', marginBottom: '3rem' }}
            >
              <h1
                className="dashboard-title"
                style={{
                  fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                }}
              >
                {property?.title}
              </h1>
              <p
                className="dashboard-subtitle"
                style={{
                  color: '#64748b',
                  fontSize: '1.05rem',
                  marginBottom: '1.25rem',
                }}
              >
                {property?.address || 'Property Details'}
              </p>
              <div style={{ height: 1, backgroundColor: '#e2e8f0' }} />
            </motion.div>
  
            <div className="dashboard-content" style={{ gap: '3rem' }}>
              <div
                className="auth-form"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  background: 'transparent',
                  boxShadow: 'none',
                  padding: 0,
                }}
              >
                {error && <div className="error-message">{error}</div>}
  
                {/* Property Information */}
                <motion.div
                  className="verification-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    marginBottom: '3rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    padding: '1.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#0f172a',
                      marginBottom: '1.25rem',
                    }}
                  >
                    Property Information
                  </h3>
  
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {[
                      { label: 'Title', value: property?.title },
                      { label: 'Address', value: property?.address },
                      { label: 'Area', value: property?.areaInSqFt ? `${property?.areaInSqFt} sq ft` : 'N/A' },
                      { label: 'Owner', value: property?.SellerId?.name },
                      {
                        label: 'Created',
                        value: property?.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A',
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.22 }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '18px',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                          padding: '1rem 1.1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {item.label}
                        </div>
                        <div style={{ marginTop: '0.4rem', color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>
                          {item.value || 'N/A'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
  
                {/* Description */}
                <motion.div
                  className="verification-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    marginBottom: '3rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    padding: '1.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#0f172a',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Description
                  </h3>
                  <p style={{ color: '#0f172a', lineHeight: 1.75, margin: 0 }}>
                    {property?.description}
                  </p>
                </motion.div>
  
                {/* Satellite Verification Section */}
                <motion.div
                  className="verification-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    marginBottom: '3rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    padding: '1.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#0f172a',
                      marginBottom: '1rem',
                    }}
                  >
                    Satellite Verification
                  </h3>
  
                  {property?.satelliteVerification ? (
                    <div>
                      <p style={{ margin: 0, color: '#0f172a' }}>
                        <strong>Status:</strong>
                        <span
                          style={{
                            marginLeft: '0.6rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            border: '1px solid #e2e8f0',
                            backgroundColor:
                              property.satelliteVerification.status === 'verified'
                                ? '#ecfdf5'
                                : property.satelliteVerification.status === 'pending'
                                  ? '#fffbeb'
                                  : '#fef2f2',
                            color:
                              property.satelliteVerification.status === 'verified'
                                ? '#065f46'
                                : property.satelliteVerification.status === 'pending'
                                  ? '#b45309'
                                  : '#991b1b',
                          }}
                        >
                          {property.satelliteVerification.status}
                        </span>
                      </p>
  
                      {property.satelliteVerification.status === 'verified' && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                              gap: '1rem',
                            }}
                          >
                            {[
                              { label: 'Total Area', value: `${property.satelliteVerification.totalAreaHa} hectares` },
                              { label: 'Annual Carbon Credits', value: property.satelliteVerification.carbonCreditsYear },
                              { label: 'Analysis Date', value: new Date(property.satelliteVerification.analysisDate).toLocaleDateString() },
                            ].map((item, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.22 }}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '18px',
                                  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                                  padding: '1rem 1.1rem',
                                }}
                              >
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                  {item.label}
                                </div>
                                <div style={{ marginTop: '0.4rem', color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>
                                  {item.value}
                                </div>
                              </motion.div>
                            ))}
                          </div>
  
                          {property.satelliteVerification.images && (
                            <div style={{ marginTop: '1.5rem' }}>
                              <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                Analysis Images
                              </h4>
  
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
                                {property.satelliteVerification.images.satellite && (
                                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }} style={{ flex: '1 1 320px' }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontWeight: 600 }}>
                                      Satellite Image
                                    </h5>
                                    <img
                                      src={`data:image/png;base64,${property.satelliteVerification.images.satellite}`}
                                      alt="Satellite view"
                                      style={{
                                        width: '100%',
                                        height: '220px',
                                        objectFit: 'contain',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '18px',
                                        boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                                        background: '#ffffff',
                                      }}
                                    />
                                  </motion.div>
                                )}
  
                                {property.satelliteVerification.images.analysis && (
                                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }} style={{ flex: '1 1 320px' }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontWeight: 600 }}>
                                      Vegetation Analysis
                                    </h5>
                                    <img
                                      src={`data:image/png;base64,${property.satelliteVerification.images.analysis}`}
                                      alt="Analysis view"
                                      style={{
                                        width: '100%',
                                        height: '220px',
                                        objectFit: 'contain',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '18px',
                                        boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                                        background: '#ffffff',
                                      }}
                                    />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          )}
  
                          {property.satelliteVerification.breakdown && (
                            <div style={{ marginTop: '1.5rem' }}>
                              <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                Land Classification
                              </h4>
  
                              <div
                                style={{
                                  marginTop: '0.75rem',
                                  overflowX: 'auto',
                                  borderRadius: '18px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                                  background: '#ffffff',
                                }}
                              >
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                      <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#0f172a' }}>Type</th>
                                      <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#0f172a' }}>Area (ha)</th>
                                      <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#0f172a' }}>Credits</th>
                                      <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#0f172a' }}>%</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {property.satelliteVerification.breakdown.map((item, index) => (
                                      <tr key={index}>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>{item.type}</td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>{item.area_ha}</td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>{item.credits}</td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{item.percent}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
  
                      {property.satelliteVerification.status === 'failed' && (
                        <div style={{ marginTop: '1rem', color: '#991b1b' }}>
                          <p style={{ margin: 0 }}><strong>Error:</strong> {property.satelliteVerification.error}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#64748b', margin: 0 }}>
                      Satellite verification not performed yet.
                    </p>
                  )}
  
                  {isOwner && property?.boundaryCoordinates && property.boundaryCoordinates.length > 0 && (
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ marginTop: '1.25rem' }}>
                      <button
                        onClick={async () => {
                          try {
                            // Format coordinates correctly for satellite service [lng, lat] for Shapely Polygon
                            const formattedCoordinates = property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]);
                            const result = await apiClient.verifyPropertyWithSatellite(id, formattedCoordinates);
                            alert('Satellite verification initiated successfully!');
                            // Refresh the page to see updated status
                            window.location.reload();
                          } catch (error) {
                            alert(`Error initiating satellite verification: ${error.message}`);
                          }
                        }}
                        className="action-button primary"
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.9rem 1.25rem',
                          borderRadius: '18px',
                          background: 'linear-gradient(135deg, #065f46, #047857)',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                          border: '1px solid rgba(15,23,42,0.06)',
                        }}
                        disabled={property?.satelliteVerification?.status === 'pending'}
                      >
                        {property?.satelliteVerification?.status === 'pending'
                          ? 'Verification in Progress...'
                          : 'Initiate Satellite Verification'}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
  
                {/* Geotagged Images */}
                <motion.div
                  className="verification-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    marginBottom: '3rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    padding: '1.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#0f172a',
                      marginBottom: '1rem',
                    }}
                  >
                    Geotagged Images
                  </h3>
  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
                    {property?.geotaggedImagesUrls?.map((imageUrl, index) => (
                      <motion.div key={index} whileHover={{ y: -4 }} transition={{ duration: 0.22 }} style={{ flex: '1 1 220px' }}>
                        <img
                          src={imageUrl}
                          alt={`Property image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '220px',
                            objectFit: 'cover',
                            borderRadius: '18px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                            background: '#ffffff',
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
  
                {/* Actions (preserve all buttons + hrefs) */}
                {isOwner && (
                  <motion.div
                    className="dashboard-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem',
                      marginTop: '1rem',
                    }}
                  >
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href={`/property/${id}/edit`}
                        className="action-button primary"
                        style={{
                          display: 'inline-block',
                          width: '100%',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '18px',
                          background: 'linear-gradient(135deg, #065f46, #047857)',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                          color: '#ffffff',
                        }}
                      >
                        Edit Property
                      </Link>
                    </motion.div>
  
                    {/* Premium red (not bright) */}
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href={`/property/${id}/delete`}
                        className="action-button secondary"
                        style={{
                          display: 'inline-block',
                          width: '100%',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '18px',
                          background: 'linear-gradient(180deg, #fff1f2 0%, #ffffff 100%)',
                          border: '1px solid #fecdd3',
                          color: '#9f1239',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                        }}
                      >
                        Delete Property
                      </Link>
                    </motion.div>
  
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href={`/property/${id}/map-visualization`}
                        className="action-button primary"
                        style={{
                          display: 'inline-block',
                          width: '100%',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '18px',
                          background: 'linear-gradient(135deg, #065f46, #047857)',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                          color: '#ffffff',
                        }}
                      >
                        View on Map
                      </Link>
                    </motion.div>
  
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href={`/property/${id}/satellite-verification`}
                        className="action-button primary"
                        style={{
                          display: 'inline-block',
                          width: '100%',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '18px',
                          background: 'linear-gradient(135deg, #065f46, #047857)',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                          color: '#ffffff',
                        }}
                      >
                        Satellite Verification
                      </Link>
                    </motion.div>
  
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href="/dashboard"
                        className="action-button secondary"
                        style={{
                          display: 'inline-block',
                          width: '100%',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '18px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#0f172a',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                        }}
                      >
                        Back to Dashboard
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
  
                {!isOwner && (
                  <motion.div
                    className="dashboard-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}
                  >
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href="/dashboard"
                        className="action-button secondary"
                        style={{
                          display: 'inline-block',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '18px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#0f172a',
                          boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                        }}
                      >
                        Back to Dashboard
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailPage;