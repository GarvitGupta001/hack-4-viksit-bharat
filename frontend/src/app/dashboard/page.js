'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const DashboardPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [carbonCoins, setCarbonCoins] = useState(0);
  const [properties, setProperties] = useState([]);
  const [assetsCount, setAssetsCount] = useState(0);
  const router = useRouter();

  // Check authentication status and fetch user data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';

      setIsLoggedIn(loggedIn);

      // Redirect if not logged in
      if (!loggedIn) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user profile
        const profileResponse = await apiClient.getProfile();
        setUserData(profileResponse.data);
        console.log(profileResponse.data)

        // Check if user is verified from the profile response
        const isUserVerified = profileResponse.data.verified;
        setIsIdentityVerified(isUserVerified);

        // Update localStorage with current verification status
        localStorage.setItem('identityVerified', isUserVerified ? 'true' : 'false');

        // Redirect to verification if user is not verified
        if (!isUserVerified) {
          router.push('/verify-identity');
          return;
        }

        // Fetch carbon coin balance
        const coinsResponse = await apiClient.getCarbonCoinBalance();
        setCarbonCoins(coinsResponse.data.amount || 0);

        // Update localStorage with current carbon coins
        localStorage.setItem('carbonCoins', coinsResponse.data.amount || 0);

        // Fetch user's properties if they are a seller
        if (profileResponse.data.type === 'seller') {
          const propertiesResponse = await apiClient.getMyProperties();
          setProperties(propertiesResponse.data);
          setAssetsCount(propertiesResponse.data.length);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error fetching data, log out the user
        apiClient.logout();
        router.push('/login');
      }
    };

    initializeDashboard();
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <p>Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API logout fails, clear local storage and redirect
      localStorage.clear();
      router.push('/login');
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title" style={{fontSize: "3rem"}}>Welcome, {userData?.name || 'User'}!</h1>
            <p className="dashboard-subtitle">Manage your carbon credit portfolio</p>
          </div>

          <div className="dashboard-content">
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Carbon Credits</h3>
                <p className="card-value">{carbonCoins}</p>
              </div>

              <div className="dashboard-card">
                <h3>Account Type</h3>
                <p className="card-value">{userData?.type || 'N/A'}</p>
              </div>

              <div className="dashboard-card">
                <h3>Verified Status</h3>
                <p className="card-value">{userData?.verified ? 'Yes' : 'No'}</p>
              </div>

              {userData?.type === 'seller' && (
                <div className="dashboard-card">
                  <h3>Properties</h3>
                  <p className="card-value">{assetsCount}</p>
                </div>
              )}

              {userData?.type === 'seller' && properties.length > 0 && (
                <>
                  <div className="dashboard-card">
                    <h3>Verified Properties</h3>
                    <p className="card-value">
                      {properties.filter(p => p.satelliteVerification && p.satelliteVerification.status === 'verified').length}
                    </p>
                  </div>
                  <div className="dashboard-card">
                    <h3>Pending Verification</h3>
                    <p className="card-value">
                      {properties.filter(p => p.satelliteVerification && p.satelliteVerification.status === 'pending').length}
                    </p>
                  </div>
                  <div className="dashboard-card">
                    <h3>Total Carbon Credits</h3>
                    <p className="card-value">
                      {properties.reduce((total, p) => {
                        if (p.satelliteVerification && p.satelliteVerification.status === 'verified') {
                          return total + (p.satelliteVerification.carbonCreditsYear || 0);
                        }
                        return total;
                      }, 0)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Status message */}
            <div className="status-text" style={{fontSize: "1rem", marginBottom: "2rem"}}>
              {userData?.type === 'seller'
                ? 'Manage your properties and verify them using satellite imagery to earn carbon credits.'
                : 'Browse available carbon credits from verified sellers.'}
            </div>

            {/* Satellite Verification Section for Sellers */}
            {userData?.type === 'seller' && (
              <div className="verification-step" style={{
                backgroundColor: '#f5f9f5',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #c8e6c9',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '1rem' }}>Satellite Verification</h3>
                <p style={{ marginBottom: '1rem', color: '#555' }}>
                  Properties with boundary coordinates can be verified using satellite imagery to accurately calculate carbon credits.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '6px',
                    border: '1px solid #a5d6a7',
                    flex: '1',
                    minWidth: '200px'
                  }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2e7d32' }}>
                      Total Potential: {properties.reduce((total, p) => {
                        if (p.satelliteVerification && p.satelliteVerification.status === 'verified') {
                          return total + (p.satelliteVerification.carbonCreditsYear || 0);
                        }
                        return total;
                      }, 0)} Carbon Credits
                    </p>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fff3e0',
                    borderRadius: '6px',
                    border: '1px solid #ffcc80',
                    flex: '1',
                    minWidth: '200px'
                  }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#ef6c00' }}>
                      Pending Verification: {properties.filter(p => p.satelliteVerification && p.satelliteVerification.status === 'pending').length} properties
                    </p>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px',
                    border: '1px solid #90caf9',
                    flex: '1',
                    minWidth: '200px'
                  }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1565c0' }}>
                      Ready for Verification: {properties.filter(p =>
                        p.boundaryCoordinates &&
                        p.boundaryCoordinates.length > 0 &&
                        (!p.satelliteVerification || p.satelliteVerification.status !== 'verified')
                      ).length} properties
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Properties section for sellers */}
            {userData?.type === 'seller' && properties.length > 0 && (
              <div className="verification-step" style={{ marginTop: '2rem' }}>
                <h3>Your Properties</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                  {properties.map((property) => (
                    <div key={property._id} className="dashboard-card" style={{ padding: '1.5rem' }}>
                      <h4 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>{property.title}</h4>
                      <p style={{ color: '#757575', marginBottom: '1rem', minHeight: '60px' }}>
                        {property.description.substring(0, 100)}{property.description.length > 100 ? '...' : ''}
                      </p>
                      <p><strong>Location:</strong> {property.address}</p>
                      <p><strong>Area:</strong> {property.areaInSqFt} sq ft</p>

                      {/* Satellite Verification Status */}
                      <div style={{ marginTop: '1rem' }}>
                        <p><strong>Satellite Verification:</strong></p>
                        {property.satelliteVerification ? (
                          <div style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: property.satelliteVerification.status === 'verified' ? '#e8f5e9' :
                                            property.satelliteVerification.status === 'pending' ? '#fff3e0' : '#ffebee',
                            color: property.satelliteVerification.status === 'verified' ? '#2e7d32' :
                                   property.satelliteVerification.status === 'pending' ? '#ef6c00' : '#c62828',
                            fontSize: '0.8rem'
                          }}>
                            {property.satelliteVerification.status}
                          </div>
                        ) : (
                          <span style={{ color: '#757575', fontSize: '0.8rem' }}>Not verified</span>
                        )}

                        {property.satelliteVerification?.status === 'verified' && property.satelliteVerification.carbonCreditsYear && (
                          <p style={{ marginTop: '0.5rem', color: '#2e7d32', fontWeight: 'bold' }}>
                            Earned: {property.satelliteVerification.carbonCreditsYear} carbon credits/year
                          </p>
                        )}
                      </div>

                      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link
                          href={`/property/${property._id}`}
                          className="action-button primary"
                          style={{ display: 'inline-block', margin: '0.25rem' }}
                        >
                          View Details
                        </Link>

                        {property.satelliteVerification?.status !== 'verified' && property.boundaryCoordinates && property.boundaryCoordinates.length > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                // Format coordinates correctly for satellite service [lng, lat] for Shapely Polygon
                                const formattedCoordinates = property.boundaryCoordinates.map(coord => [coord.lng, coord.lat]);
                                const result = await apiClient.verifyPropertyWithSatellite(property._id, formattedCoordinates);
                                alert('Satellite verification initiated successfully!');
                                // Refresh the page to see updated status
                                window.location.reload();
                              } catch (error) {
                                alert(`Error initiating satellite verification: ${error.message}`);
                              }
                            }}
                            className="action-button secondary"
                            style={{ display: 'inline-block', margin: '0.25rem' }}
                            disabled={property.satelliteVerification?.status === 'pending'}
                          >
                            {property.satelliteVerification?.status === 'pending'
                              ? 'Verifying...'
                              : 'Verify with Satellite'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-actions" style={{fontSize: "1rem", marginTop: "2rem" }}>
              {userData?.type === 'seller' ? (
                <>
                  <Link href="/property-verification" className="action-button primary">
                    Add New Property
                  </Link>
                  <Link href="/transfer-coins" className="action-button secondary">
                    Transfer Carbon Coins
                  </Link>
                </>
              ) : userData?.type === 'company' ? (
                <>
                  <Link href="/company/register" className="action-button primary">
                    Register Company Documents
                  </Link>
                  <Link href="/transfer-coins" className="action-button secondary">
                    Transfer Carbon Coins
                  </Link>
                </>
              ) : (
                <Link href="/properties" className="action-button primary">
                  Browse Properties
                </Link>
              )}

              <button onClick={handleLogout} className="action-button secondary" style={{fontSize: "1rem"}}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;