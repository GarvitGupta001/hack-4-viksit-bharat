'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import apiClient from '../../services/api';

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
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">Transfer Carbon Coins</h1>
              <p className="dashboard-subtitle">Send carbon coins to other verified users</p>
            </div>

            <div className="dashboard-content">
              <div className="dashboard-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h3>Current Balance</h3>
                <p className="card-value">{balance} coins</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="toUserId">Recipient User ID</label>
                  <input
                    type="text"
                    id="toUserId"
                    name="toUserId"
                    value={formData.toUserId}
                    onChange={handleInputChange}
                    className="upload-input"
                    placeholder="Enter recipient's user ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount to Transfer</label>
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
                  />
                  <small style={{ color: '#757575', marginTop: '0.5rem', display: 'block' }}>
                    Available: {balance} coins
                  </small>
                </div>

                <div className="dashboard-actions">
                  <button type="submit" className="action-button primary" disabled={transferring}>
                    {transferring ? 'Processing Transfer...' : 'Transfer Coins'}
                  </button>
                  <Link href="/dashboard" className="action-button secondary">
                    Back to Dashboard
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarbonCoinTransferPage;