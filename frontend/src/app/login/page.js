'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = 'Email or phone is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare credentials for API
      const credentials = {
        email: formData.emailOrPhone,
        password: formData.password
      };

      // Call API to login user
      const response = await apiClient.login(credentials);

      // Store user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.user.name);
      localStorage.setItem('isLoggedIn', 'true');

      // Check if user is already verified
      if (response.data.user.verified) {
        // If user is already verified, redirect to dashboard
        localStorage.setItem('identityVerified', 'true');
        router.push('/dashboard');
      } else {
        // If user is not verified, redirect to identity verification
        router.push('/verify-identity');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ api: error.message || 'Login failed. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        <div className="auth-container" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            className="surface-elevated"
            style={{ width: '100%', maxWidth: '420px', padding: '2rem', borderRadius: '1rem' }}
          >
            <h1 className="text-title" style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#0f172a' }}>
              Log In
            </h1>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Access your CarbonCoin account
            </p>

            {errors.api && (
              <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#b91c1c', fontSize: '0.9rem' }}>
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="emailOrPhone" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>Email or Phone</label>
                <input
                  type="text"
                  id="emailOrPhone"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  className={errors.emailOrPhone ? 'error' : ''}
                  placeholder="Enter your email or phone number"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(15, 23, 42, 0.12)', fontSize: '1rem', transition: 'var(--transition-normal)' }}
                />
                {errors.emailOrPhone && <span className="error-message" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#b91c1c' }}>{errors.emailOrPhone}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(15, 23, 42, 0.12)', fontSize: '1rem', transition: 'var(--transition-normal)' }}
                />
                {errors.password && <span className="error-message" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#b91c1c' }}>{errors.password}</span>}
              </div>

              <button type="submit" className="submit-button" disabled={isLoading} style={{ width: '100%', padding: '0.75rem 1.25rem', marginTop: '0.5rem', borderRadius: '0.75rem', fontWeight: 600, transition: 'var(--transition-normal)', background: "linear-gradient(to right, #059669, #15803D)" }}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(15, 23, 42, 0.08)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>New user? <Link href="/signup" className="auth-link">Create an account</Link></p>
            </div>

            <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
              Secure authentication · Powered by AI verification
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;