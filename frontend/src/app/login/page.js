'use client';

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
        <div className="auth-container">
          <div className="auth-form">
            <h1 className="form-title">Log In</h1>

            {errors.api && (
              <div className="error-message">
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="emailOrPhone">Email or Phone</label>
                <input
                  type="text"
                  id="emailOrPhone"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  className={errors.emailOrPhone ? 'error' : ''}
                  placeholder="Enter your email or phone number"
                  disabled={isLoading}
                />
                {errors.emailOrPhone && <span className="error-message">{errors.emailOrPhone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="auth-footer">
              <p style={{color:"black"}}> New user? <Link href="/signup" className="auth-link">Create an account</Link></p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;