'use client';

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
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">{property?.title}</h1>
              <p className="dashboard-subtitle">Property Details</p>
            </div>

            <div className="dashboard-content">
              <div className="auth-form">
                {error && <div className="error-message">{error}</div>}

                <div className="verification-step" style={{ marginBottom: '2rem' }}>
                  <h3>Property Information</h3>
                  <p><strong>Title:</strong> {property?.title}</p>
                  <p><strong>Description:</strong> {property?.description}</p>
                  <p><strong>Address:</strong> {property?.address}</p>
                  <p><strong>Area:</strong> {property?.areaInSqFt} sq ft</p>
                  <p><strong>Owner:</strong> {property?.SellerId?.name}</p>
                  <p><strong>Created:</strong> {property?.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>

                {/* Satellite Verification Section */}
                <div className="verification-step" style={{ marginBottom: '2rem' }}>
                  <h3>Satellite Verification</h3>
                  {property?.satelliteVerification ? (
                    <div>
                      <p><strong>Status:</strong>
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: property.satelliteVerification.status === 'verified' ? '#e8f5e9' :
                                          property.satelliteVerification.status === 'pending' ? '#fff3e0' : '#ffebee',
                          color: property.satelliteVerification.status === 'verified' ? '#2e7d32' :
                                 property.satelliteVerification.status === 'pending' ? '#ef6c00' : '#c62828'
                        }}>
                          {property.satelliteVerification.status}
                        </span>
                      </p>

                      {property.satelliteVerification.status === 'verified' && (
                        <div style={{ marginTop: '1rem' }}>
                          <p><strong>Total Area:</strong> {property.satelliteVerification.totalAreaHa} hectares</p>
                          <p><strong>Annual Carbon Credits:</strong> {property.satelliteVerification.carbonCreditsYear}</p>
                          <p><strong>Analysis Date:</strong> {new Date(property.satelliteVerification.analysisDate).toLocaleDateString()}</p>

                          {property.satelliteVerification.images && (
                            <div style={{ marginTop: '1rem' }}>
                              <h4>Analysis Images:</h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                                {property.satelliteVerification.images.satellite && (
                                  <div style={{ flex: '1 1 300px' }}>
                                    <h5>Satellite Image</h5>
                                    <img
                                      src={`data:image/png;base64,${property.satelliteVerification.images.satellite}`}
                                      alt="Satellite view"
                                      style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'contain',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px'
                                      }}
                                    />
                                  </div>
                                )}
                                {property.satelliteVerification.images.analysis && (
                                  <div style={{ flex: '1 1 300px' }}>
                                    <h5>Vegetation Analysis</h5>
                                    <img
                                      src={`data:image/png;base64,${property.satelliteVerification.images.analysis}`}
                                      alt="Analysis view"
                                      style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'contain',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {property.satelliteVerification.breakdown && (
                            <div style={{ marginTop: '1rem' }}>
                              <h4>Land Classification:</h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ddd' }}>Type</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ddd' }}>Area (ha)</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ddd' }}>Credits</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ddd' }}>%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {property.satelliteVerification.breakdown.map((item, index) => (
                                    <tr key={index}>
                                      <td style={{ padding: '0.5rem', border: '1px solid #ddd' }}>{item.type}</td>
                                      <td style={{ padding: '0.5rem', border: '1px solid #ddd' }}>{item.area_ha}</td>
                                      <td style={{ padding: '0.5rem', border: '1px solid #ddd' }}>{item.credits}</td>
                                      <td style={{ padding: '0.5rem', border: '1px solid #ddd' }}>{item.percent}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {property.satelliteVerification.status === 'failed' && (
                        <div style={{ marginTop: '1rem', color: '#c62828' }}>
                          <p><strong>Error:</strong> {property.satelliteVerification.error}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#757575' }}>Satellite verification not performed yet.</p>
                  )}

                  {isOwner && property?.boundaryCoordinates && property.boundaryCoordinates.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
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
                        style={{ marginTop: '1rem' }}
                        disabled={property?.satelliteVerification?.status === 'pending'}
                      >
                        {property?.satelliteVerification?.status === 'pending'
                          ? 'Verification in Progress...'
                          : 'Initiate Satellite Verification'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="verification-step" style={{ marginBottom: '2rem' }}>
                  <h3>Geotagged Images</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    {property?.geotaggedImagesUrls?.map((imageUrl, index) => (
                      <div key={index} style={{ flex: '1 1 200px', textAlign: 'center' }}>
                        <img
                          src={imageUrl}
                          alt={`Property image ${index + 1}`}
                          style={{
                            maxWidth: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {isOwner && (
                  <div className="dashboard-actions">
                    <Link href={`/property/${id}/edit`} className="action-button primary">
                      Edit Property
                    </Link>
                    <Link href={`/property/${id}/delete`} className="action-button secondary" style={{ backgroundColor: '#f44336' }}>
                      Delete Property
                    </Link>
                    <Link href={`/property/${id}/map-visualization`} className="action-button primary">
                      View on Map
                    </Link>
                    <Link href={`/property/${id}/satellite-verification`} className="action-button primary">
                      Satellite Verification
                    </Link>
                    <Link href="/dashboard" className="action-button secondary">
                      Back to Dashboard
                    </Link>
                  </div>
                )}

                {!isOwner && (
                  <div className="dashboard-actions">
                    <Link href="/dashboard" className="action-button secondary">
                      Back to Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailPage;