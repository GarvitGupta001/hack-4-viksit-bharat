'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [carbonCoins, setCarbonCoins] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check login status from localStorage on component mount
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    // Get carbon coins from localStorage
    const coins = parseInt(localStorage.getItem('carbonCoins') || '0', 10);
    setCarbonCoins(coins);
    
    // Listen for storage changes to update coins in real-time
    const handleStorageChange = () => {
      const updatedCoins = parseInt(localStorage.getItem('carbonCoins') || '0', 10);
      setCarbonCoins(updatedCoins);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes (in case same tab updates)
    const interval = setInterval(() => {
      const updatedCoins = parseInt(localStorage.getItem('carbonCoins') || '0', 10);
      setCarbonCoins(prevCoins => {
        if (updatedCoins !== prevCoins) {
          return updatedCoins;
        }
        return prevCoins;
      });
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('identityVerified');
    localStorage.removeItem('carbonCoins');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link href="/" className="logo">
            CarbonCoin
          </Link>
        </div>

        <div className="nav-menu">
        </div>

        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <div className="nav-button coins-btn">
                <span className="coin-icon"></span>
                <span className="coin-count">{carbonCoins}</span>
              </div>
              <Link href="/dashboard" className="nav-button dashboard-btn">Dashboard</Link>
              <button onClick={handleLogout} className="nav-button logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link href="/" className="nav-button home-btn">Home</Link>
              <Link href="/#about" className="nav-button about-btn">About Us</Link>
              <Link href="/signup" className="nav-button signup-btn">Sign Up</Link>
              <Link href="/login" className="nav-button login-btn">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;