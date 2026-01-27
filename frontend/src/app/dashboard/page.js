'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import apiClient from '../../services/api';

const DashboardPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [carbonCoins, setCarbonCoins] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);
  const router = useRouter();

  // Check authentication status and fetch user data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const identityVerified = localStorage.getItem('identityVerified') === 'true';

      setIsLoggedIn(loggedIn);
      setIsIdentityVerified(identityVerified);

      // Redirect if not logged in or not identity verified
      if (!loggedIn) {
        router.push('/login');
        return;
      } else if (!identityVerified) {
        router.push('/verify-identity');
        return;
      }

      try {
        // Fetch user profile
        const profileResponse = await apiClient.getProfile();
        setUserData(profileResponse.data);

        // Fetch carbon coin balance
        const coinsResponse = await apiClient.getCarbonCoinBalance();
        setCarbonCoins(coinsResponse.data.amount || 0);

        // Update localStorage with current carbon coins
        localStorage.setItem('carbonCoins', coinsResponse.data.amount || 0);

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
            </div>

            <div className="status-text" style={{fontSize: "1rem"}}>
              {userData?.type === 'seller'
                ? 'Property verification pending. Upload documents to earn carbon credits.'
                : 'Browse available carbon credits from verified sellers.'}
            </div>

            <div className="dashboard-actions" style={{fontSize: "1rem"}}>
              {userData?.type === 'seller' ? (
                <Link href="/property-verification" className="action-button primary">
                  Start Property Verification
                </Link>
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