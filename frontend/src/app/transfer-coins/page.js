'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const CarbonCoinTransferPage = () => {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    toUserId: '',
    amount: ''
  });

  // Load carbon coin balance on component mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await apiClient.getCarbonCoinBalance();
        setBalance(response.data.amount || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load balance');
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    if (!formData.toUserId.trim()) {
      setError('Recipient user ID is required');
      return false;
    }

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Transfer amount is required and must be a positive number');
      return false;
    }

    if (parseFloat(formData.amount) > balance) {
      setError('Insufficient balance for this transfer');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setTransferring(true);
    setError('');
    setSuccess('');

    try {
      const transferData = {
        toUserId: formData.toUserId,
        amount: parseFloat(formData.amount)
      };

      const response = await apiClient.transferCarbonCoins(transferData);
      
      setSuccess(response.message);
      setBalance(response.data.senderBalance);
      
      // Reset form
      setFormData({
        toUserId: '',
        amount: ''
      });
      
      // Update localStorage with new balance
      localStorage.setItem('carbonCoins', response.data.senderBalance);
    } catch (err) {
      setError(err.message || 'Failed to transfer carbon coins');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <p>Loading balance...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ background: '#f8fafc' }}>
      <Navbar />
      <main className="main-content">
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div className="dashboard-container" style={{ maxWidth: '920px' }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              className="dashboard-header"
              style={{ textAlign: 'left', marginBottom: '2rem' }}
            >
              <h1
                className="dashboard-title"
                style={{
                  fontSize: 'clamp(2.2rem, 4vw, 2.8rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                }}
              >
                Transfer Carbon Coins
              </h1>
              <p className="dashboard-subtitle" style={{ color: '#64748b', marginBottom: '1.25rem' }}>
                Securely transfer your carbon credits to another verified account.
              </p>
              <div style={{ borderBottom: '1px solid #e2e8f0' }} />
            </motion.div>
  
            <div className="dashboard-content">
              {/* Balance card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="dashboard-card"
                style={{
                  marginBottom: '2.5rem',
                  textAlign: 'left',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                  padding: '2rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                  }}
                >
                  Current Balance
                </div>
                <div
                  className="card-value"
                  style={{
                    fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#0f172a',
                    lineHeight: 1.05,
                  }}
                >
                  {balance}
                </div>
                <div style={{ marginTop: '0.35rem', color: '#64748b', fontWeight: 600 }}>
                  coins available
                </div>
              </motion.div>
  
              {/* Form card */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                className="auth-form"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  boxShadow: '0 25px 60px rgba(15, 23, 42, 0.06)',
                  padding: '2.5rem',
                }}
              >
                {error && (
                  <div
                    className="error-message"
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: '14px',
                      padding: '0.85rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {error}
                  </div>
                )}
  
                {success && (
                  <div
                    className="success-message"
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      borderRadius: '14px',
                      padding: '0.85rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {success}
                  </div>
                )}
  
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="toUserId"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: '#334155',
                      marginBottom: 6,
                    }}
                  >
                    Recipient User ID
                  </label>
                  <input
                    type="text"
                    id="toUserId"
                    name="toUserId"
                    value={formData.toUserId}
                    onChange={handleInputChange}
                    className="upload-input"
                    placeholder="Enter recipient's user ID"
                    required
                    style={{
                      height: 52,
                      width: '100%',
                      padding: '0 16px',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0f766e';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
  
                <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                  <label
                    htmlFor="amount"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: '#334155',
                      marginBottom: 6,
                    }}
                  >
                    Amount to Transfer
                  </label>
  
                  {/* Amount input with visual currency indicator (no logic change) */}
                  <div style={{ position: 'relative' }}>
                    <div
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        pointerEvents: 'none',
                      }}
                    >
                      CC
                    </div>
  
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="upload-input"
                      placeholder="Enter amount to transfer"
                      min="1"
                      max={balance}
                      step="0.01"
                      required
                      style={{
                        height: 52,
                        width: '100%',
                        padding: '0 16px 0 44px',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        fontSize: '1.1rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#0f766e';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    />
                  </div>
  
                  <small style={{ color: '#64748b', marginTop: '0.6rem', display: 'block' }}>
                    Available: <strong style={{ color: '#0f172a' }}>{balance}</strong> coins
                  </small>
                </div>
  
                <div
                  className="dashboard-actions"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                  }}
                >
                  <motion.button
                    type="submit"
                    className="action-button primary"
                    disabled={transferring}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      height: 54,
                      padding: '0 28px',
                      borderRadius: 16,
                      background: '#0f766e',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      color: '#ffffff',
                      fontWeight: 600,
                      transition: '200ms ease',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                      opacity: transferring ? 0.6 : 1,
                      cursor: transferring ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#0d9488';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0f766e';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {transferring ? 'Processing Transfer...' : 'Transfer Coins'}
                  </motion.button>
  
                  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.22 }}>
                    <Link
                      href="/dashboard"
                      className="action-button secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 54,
                        padding: '0 22px',
                        borderRadius: 16,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a',
                        fontWeight: 600,
                        boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                        textDecoration: 'none',
                        transition: '200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      Back to Dashboard
                    </Link>
                  </motion.div>
                </div>
              </motion.form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarbonCoinTransferPage;