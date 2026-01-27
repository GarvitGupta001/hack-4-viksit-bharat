'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import apiClient from '../../services/api';

const PropertiesPage = () => {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);

  // Load properties data on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await apiClient.getAllProperties({ 
          page: currentPage, 
          limit: 10 
        });
        
        setProperties(response.data.properties);
        setTotalPages(response.data.totalPages);
        setTotalProperties(response.data.total);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load properties');
        setLoading(false);
      }
    };

    fetchProperties();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <p>Loading properties...</p>
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
              <h1 className="dashboard-title">Properties</h1>
              <p className="dashboard-subtitle">Browse verified green assets</p>
            </div>

            <div className="dashboard-content">
              <div className="dashboard-cards">
                <div className="dashboard-card" style={{ textAlign: 'center' }}>
                  <h3>Total Properties</h3>
                  <p className="card-value">{totalProperties}</p>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                {properties.length === 0 ? (
                  <p>No properties found.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {properties.map((property) => (
                      <div key={property._id} className="dashboard-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>{property.title}</h3>
                        <p style={{ color: '#757575', marginBottom: '1rem', minHeight: '60px' }}>
                          {property.description.substring(0, 100)}{property.description.length > 100 ? '...' : ''}
                        </p>
                        <p><strong>Location:</strong> {property.address}</p>
                        <p><strong>Area:</strong> {property.areaInSqFt} sq ft</p>
                        <p><strong>Owner:</strong> {property.SellerId?.name || 'N/A'}</p>
                        
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                          <Link 
                            href={`/property/${property._id}`} 
                            className="action-button primary"
                            style={{ display: 'inline-block', margin: '0.5rem' }}
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="action-button secondary"
                    style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
                  >
                    Previous
                  </button>
                  
                  <span style={{ margin: '0 1rem', color: '#757575' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="action-button secondary"
                    style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="dashboard-actions">
                <Link href="/dashboard" className="action-button secondary">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertiesPage;