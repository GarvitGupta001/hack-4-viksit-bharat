'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import apiClient from '../../services/api';

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

                  {/* Satellite Verification Status */}
                  <div className="verification-step" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                    <h3>Satellite Verification Status</h3>
                    {property?.satelliteVerification ? (
                      <div>
                        <p><strong>Status:</strong>
                          <span style={{
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor:
                              property.satelliteVerification.status === 'verified' ? '#e8f5e9' :
                              property.satelliteVerification.status === 'processing' ? '#fff3e0' :
                              property.satelliteVerification.status === 'queued' ? '#e3f2fd' :
                              property.satelliteVerification.status === 'failed' ? '#ffebee' : '#f5f5f5',
                            color:
                              property.satelliteVerification.status === 'verified' ? '#2e7d32' :
                              property.satelliteVerification.status === 'processing' || property.satelliteVerification.status === 'queued' ? '#ef6c00' :
                              property.satelliteVerification.status === 'failed' ? '#c62828' : '#616161'
                          }}>
                            {property.satelliteVerification.status.charAt(0).toUpperCase() + property.satelliteVerification.status.slice(1)}
                          </span>
                        </p>
                        {property.satelliteVerification.carbonCredits && (
                          <p><strong>Carbon Credits Awarded:</strong> {property.satelliteVerification.carbonCredits.toFixed(2)}</p>
                        )}
                        {property.satelliteVerification.error && (
                          <p><strong>Error:</strong> {property.satelliteVerification.error}</p>
                        )}
                        {property.satelliteVerification.timestamp && (
                          <p><strong>Last Updated:</strong> {new Date(property.satelliteVerification.timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    ) : (
                      <p>No satellite verification performed yet.</p>
                    )}
                  </div>
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
                    {/* Satellite Verification Button */}
                    {(!property?.satelliteVerification ||
                      property.satelliteVerification.status === 'not_started' ||
                      property.satelliteVerification.status === 'failed') &&
                      property?.boundaryCoordinates && property.boundaryCoordinates.length >= 3 && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await apiClient.triggerSatelliteVerification(id);
                            alert(response.message);
                            // Refresh the property data
                            window.location.reload();
                          } catch (error) {
                            alert(`Error: ${error.message}`);
                          }
                        }}
                        className="action-button primary"
                        style={{ backgroundColor: '#1976d2' }}
                      >
                        Verify with Satellite
                      </button>
                    )}
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