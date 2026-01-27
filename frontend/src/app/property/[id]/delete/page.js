'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import apiClient from '../../../services/api';

const PropertyDeletePage = () => {
  const { id } = useParams(); // Get property ID from URL params
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Load property data on component mount
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await apiClient.getProperty(id);
        setProperty(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load property');
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await apiClient.deleteProperty(id);
      alert('Property deleted successfully!');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to delete property');
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <p>Loading property...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <h2>Error</h2>
              <p>{error}</p>
              <Link href="/dashboard" className="action-button primary">Back to Dashboard</Link>
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
              <h1 className="dashboard-title">Delete Property</h1>
              <p className="dashboard-subtitle">Confirm property deletion</p>
            </div>

            <div className="dashboard-content">
              <div className="auth-form">
                {error && <div className="error-message">{error}</div>}

                <div className="verification-step" style={{ marginBottom: '2rem' }}>
                  <h3>Property Details</h3>
                  <p><strong>Title:</strong> {property?.title}</p>
                  <p><strong>Description:</strong> {property?.description}</p>
                  <p><strong>Address:</strong> {property?.address}</p>
                  <p><strong>Area:</strong> {property?.areaInSqFt} sq ft</p>
                  {property?.SellerId && <p><strong>Owner:</strong> {property.SellerId.name}</p>}
                </div>

                <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  Are you sure you want to delete this property? This action cannot be undone.
                </p>

                <div className="dashboard-actions">
                  <button 
                    onClick={handleDelete} 
                    className="action-button primary"
                    disabled={deleting}
                    style={{ backgroundColor: '#f44336' }}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Property'}
                  </button>
                  <button 
                    onClick={handleCancel} 
                    className="action-button secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDeletePage;