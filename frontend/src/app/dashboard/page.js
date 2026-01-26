'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

const DashboardPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on component mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const identityVerified = localStorage.getItem('identityVerified') === 'true';

    setIsLoggedIn(loggedIn);
    setIsIdentityVerified(identityVerified);

    // Redirect if not logged in or not identity verified
    if (!loggedIn) {
      router.push('/login');
    } else if (!identityVerified) {
      router.push('/verify-identity');
    } else {
      setLoading(false);
    }
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

  // Get user data from localStorage
  const userName = localStorage.getItem('userName') || 'User'; // Default to 'User' if name not found
  const user = { name: userName };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('identityVerified');
    localStorage.removeItem('userName'); // Also remove the user's name on logout
    // Redirect to login
    router.push('/login');
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title" style={{fontSize: "3rem"}}>Welcome, {user.name}!</h1>
            <p className="dashboard-subtitle">Manage your carbon credit portfolio</p>
          </div>

          <div className="dashboard-content">
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Carbon Credits</h3>
                <p className="card-value">0</p>
              </div>

              <div className="dashboard-card">
                <h3>Documents Pending/Uploading</h3>
                <p className="card-value">0</p>
              </div>

              <div className="dashboard-card">
                <h3>Verified Assets</h3>
                <p className="card-value">0</p>
              </div>
            </div>

            <div className="status-text" style={{fontSize: "1rem"}}>
              Property verification pending. Upload documents to earn carbon credits.
            </div>

            <div className="dashboard-actions" style={{fontSize: "1rem"}}>
              <Link href="/property-verification" className="action-button primary">
                Start Property Verification
              </Link>

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