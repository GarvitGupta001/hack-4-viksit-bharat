'use client';

import { motion } from 'framer-motion';
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
    <div 
      className="page-container"
      style={{
        background: "linear-gradient(180deg, #fafbfc 0%, #ffffff 50%, #f1f5f9 100%)"
      }}
    >
      <Navbar />
    
      <main className="main-content">
        <motion.div
          className="dashboard-container section-y-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
    
          {/* ===== HEADER ===== */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: "3rem" }}
          >
            <h1
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
                color: "#065f46",
                marginTop: "2rem"
              }}
            >
              Welcome, {userData?.name || "User"}!
            </h1>
    
            <p style={{ fontSize: "1.05rem", color: "#475569", fontWeight: 500 }}>
              Manage your carbon credit portfolio
            </p>
          </motion.div>
    
    
          {/* ===== BALANCE CARD ===== */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            whileHover={{ scale: 1.01 }}
            style={{
              padding: "2.2rem 2.8rem",
              marginBottom: "3.5rem",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(6, 95, 70, 0.2)",
              border: "1px solid rgba(6, 95, 70, 0.25)"
            }}
          >
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                marginBottom: "0.8rem",
                color: "#64748b",
                fontWeight: "bold"
              }}
            >
              Available Carbon Coins
            </p>
    
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: "clamp(2.8rem, 5vw, 3.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#047857"
              }}
            >
              {carbonCoins.toLocaleString()}
            </motion.p>
          </motion.div>
    
    
          {/* ===== STATS GRID ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.6rem",
              marginBottom: "3.5rem"
            }}
          >
    
            {[
              { label: "Account Type", value: userData?.type || "N/A" },
              { label: "Verified Status", value: userData?.verified ? "Verified" : "Not Verified" },
              ...(userData?.type === "seller"
                ? [
                    { label: "Total Properties", value: assetsCount },
                    {
                      label: "Verified Properties",
                      value: properties.filter(
                        p => p.satelliteVerification?.status === "verified"
                      ).length
                    }
                  ]
                : [])
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 18px 50px rgba(6, 95, 70, 0.2), 0 0 0 1px rgba(6, 95, 70, 0.3)"
                }}
                style={{
                  padding: "1.6rem",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid rgba(6, 95, 70, 0.3)",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                }}
              >
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.6rem", fontWeight: "bold" }}>
                  {item.label}
                </p>
    
                <p style={{ 
                  fontSize: "1.6rem", 
                  fontWeight: 700, 
                  color: "#065f46"
                }}>
                  {item.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
    
    
          {/* ===== STATUS TEXT ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ marginBottom: "3.5rem" }}
          >
            <p style={{ fontSize: "1rem", color: "#475569", fontWeight: 400 }}>
              {userData?.type === "seller"
                ? "Manage your properties and verify them using satellite imagery to earn carbon credits."
                : "Browse available carbon credits from verified sellers."}
            </p>
          </motion.div>
    
    
          {/* ===== PROPERTIES ===== */}
          {userData?.type === "seller" && properties.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  marginBottom: "1.6rem",
                  color: "#065f46"
                }}
              >
                Your Properties
              </h2>
    
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.6rem"
                }}
              >
                {properties.map((property, i) => (
                  <motion.div
                    key={property._id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    whileHover={{
                      y: -6,
                      boxShadow: "0 18px 50px rgba(6, 95, 70, 0.25), 0 0 0 1px rgba(6, 95, 70, 0.35)"
                    }}
                    style={{
                      padding: "1.6rem",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                      border: "1px solid rgba(6, 95, 70, 0.3)",
                      boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                    }}
                  >
                    <h4 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#0f172a" }}>
                      {property.title}
                    </h4>
    
                    <p style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#64748b" }}>
                      {property.description.substring(0, 100)}
                    </p>
    
                    <p style={{ fontSize: "0.9rem", color: "#475569" }}>
                      <strong style={{ color: "#0f172a" }}>Area:</strong> {property.areaInSqFt} sq ft
                    </p>
    
                    <div style={{ marginTop: "1.4rem"}}>
                      <Link
                        href={`/property/${property._id}`}
                        className="action-button primary"
                        style={{background: "linear-gradient(135deg, #065f46 0%, #047857 100%)", color: "#ffffff"}}
                      >
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
  
          {/* ===== ACTION BUTTONS ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="dashboard-actions"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "3rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(6, 95, 70, 0.2)"
            }}
          >
            {userData?.type === 'seller' ? (
              <>
                <Link 
                  href="/property-verification" 
                  className="action-button primary"
                  style={{
                    display: "inline-block",
                    padding: "1rem 2rem",
                    borderRadius: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 8px 20px rgba(6, 95, 70, 0.3)",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 95, 70, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(6, 95, 70, 0.3)";
                  }}
                >
                  Add New Property
                </Link>
  
                <Link 
                  href="/transfer-coins" 
                  className="action-button secondary"
                  style={{
                    display: "inline-block",
                    padding: "1rem 2rem",
                    borderRadius: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
                    color: "#0f172a",
                    border: "1px solid rgba(6, 95, 70, 0.4)",
                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 95, 70, 0.25)";
                    e.currentTarget.style.borderColor = "rgba(6, 95, 70, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(6, 95, 70, 0.4)";
                  }}
                >
                  Transfer Carbon Coins
                </Link>
              </>
            ) : userData?.type === 'company' ? (
              <>
                <Link 
                  href="/company/register" 
                  className="action-button primary"
                  style={{
                    display: "inline-block",
                    padding: "1rem 2rem",
                    borderRadius: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 8px 20px rgba(6, 95, 70, 0.3)",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 95, 70, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(6, 95, 70, 0.3)";
                  }}
                >
                  Register Company Documents
                </Link>
  
                <Link 
                  href="/transfer-coins" 
                  className="action-button secondary"
                  style={{
                    display: "inline-block",
                    padding: "1rem 2rem",
                    borderRadius: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
                    color: "#0f172a",
                    border: "1px solid rgba(6, 95, 70, 0.4)",
                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 95, 70, 0.25)";
                    e.currentTarget.style.borderColor = "rgba(6, 95, 70, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(6, 95, 70, 0.4)";
                  }}
                >
                  Transfer Carbon Coins
                </Link>
              </>
            ) : (
              <Link 
                href="/properties" 
                className="action-button primary"
                style={{
                  display: "inline-block",
                  padding: "1rem 2rem",
                  borderRadius: "12px",
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                  color: "#ffffff",
                  border: "none",
                  boxShadow: "0 8px 20px rgba(6, 95, 70, 0.3)",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 95, 70, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(6, 95, 70, 0.3)";
                }}
              >
                Browse Properties
              </Link>
            )}
  
            <button 
              onClick={handleLogout} 
              className="action-button secondary"
              style={{
                padding: "1rem 2rem",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "1rem",
                background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
                color: "#475569",
                border: "1px solid rgba(6, 95, 70, 0.3)",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                marginBottom: "2rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.12)";
                e.currentTarget.style.borderColor = "rgba(6, 95, 70, 0.5)";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.08)";
                e.currentTarget.style.borderColor = "rgba(6, 95, 70, 0.3)";
                e.currentTarget.style.color = "#475569";
              }}
            >
              Logout
            </button>
          </motion.div>
  
        </motion.div>
      </main>
    
      <Footer />
    </div>
  );
  
};

export default DashboardPage;