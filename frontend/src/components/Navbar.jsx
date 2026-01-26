'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check login status from localStorage on component mount
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('identityVerified');
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link href="/" className="logo">CarbonCoin</Link>
        </div>

        <div className="nav-menu">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/" className="nav-link">About</Link>
        </div>

        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="nav-button dashboard-btn">Dashboard</Link>
              <button onClick={handleLogout} className="nav-button logout-btn">Logout</button>
            </>
          ) : (
            <>
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