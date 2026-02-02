'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    type: 'seller' // Default to seller type
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation (10 digits for India)
    const phoneRegex = /^\d{10}$/;
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    setSuccessMessage('');

    try {
      // Prepare user data for API
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: '', // Could be added as an input field if needed
        type: formData.type
      };

      // Call API to register user
      const response = await apiClient.register(userData);

      // Store user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.user.name);
      localStorage.setItem('isLoggedIn', 'true');

      // Show success message
      setSuccessMessage('Account created successfully! Redirecting to login...');

      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        type: 'seller'
      });

      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ api: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
  
      <main className="main-content">
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            className="surface-elevated w-full max-w-md p-8 rounded-2xl shadow-xl"
          >
            <h1 className="text-2xl font-semibold text-center text-slate-900">
              Create Account
            </h1>
  
            <p className="text-sm text-slate-500 text-center mt-2 mb-6">
              Join CarbonCoin and start earning verified carbon credits
            </p>
  
            {errors.api && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {errors.api}
              </div>
            )}
  
            {successMessage && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {successMessage}
              </div>
            )}
  
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  }`}                  
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.name}
                  </p>
                )}
              </div>
  
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  }`} 
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
  
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  }`} 
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>
  
              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  }`} 
                >
                  <option value="seller">
                    Seller (Farmer/Landowner)
                  </option>
                  <option value="company">
                    Company (Buyer)
                  </option>
                </select>
                {errors.type && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.type}
                  </p>
                )}
              </div>
  
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  }`} 
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
  
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  }`} 
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
  
              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition transform hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>
  
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-green-600 font-medium hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
  
            <p className="mt-4 text-xs text-slate-400 text-center">
              Secure authentication · Enterprise-grade data protection
            </p>
          </motion.div>
        </div>
      </main>
  
      <Footer />
    </div>
  );  
};

export default SignupPage;