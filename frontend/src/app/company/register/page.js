'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const CompanyRegistrationPage = () => {
  const router = useRouter();
  const [logoFile, setLogoFile] = useState(null);
  const [registrationFile, setRegistrationFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewRegistration, setPreviewRegistration] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e, setFile, setPreview, type) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      if (type === 'logo' && !file.type.match('image/jpeg') && !file.type.match('image/png')) {
        setError('Logo must be JPG or PNG format');
        return;
      }

      if (type === 'registration' && !file.type.match('application/pdf') && !file.type.match('image/')) {
        setError('Registration document must be PDF or image format');
        return;
      }

      // Set file object
      setFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setPreviewLogo(reader.result);
        } else {
          setPreviewRegistration(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Clear error if previously set
      if (error) setError('');
    }
  };

  const removeFile = (type) => {
    if (type === 'logo') {
      setLogoFile(null);
      setPreviewLogo(null);
    } else {
      setRegistrationFile(null);
      setPreviewRegistration(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that at least one file is uploaded
    if (!logoFile && !registrationFile) {
      setError('Please upload at least one document (logo or registration)');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const documents = {};
      if (logoFile) documents.logo = logoFile;
      if (registrationFile) documents.registrationDoc = registrationFile;

      const response = await apiClient.uploadCompanyDocuments(documents);

      setSuccess(response.message);
      // Optionally redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">Company Registration</h1>
              <p className="dashboard-subtitle">Upload company documents for verification</p>
            </div>

            <div className="dashboard-content">
              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="logo">Company Logo (Optional)</label>
                  <input
                    type="file"
                    id="logo"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setLogoFile, setPreviewLogo, 'logo')}
                    className="upload-input"
                    disabled={uploading}
                  />
                  {previewLogo && (
                    <div style={{ marginTop: '1rem', position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={previewLogo} 
                        alt="Logo preview" 
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px', 
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0'
                        }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('logo')}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="registrationDoc">Registration Document (PDF or Image)</label>
                  <input
                    type="file"
                    id="registrationDoc"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setRegistrationFile, setPreviewRegistration, 'registration')}
                    className="upload-input"
                    disabled={uploading}
                  />
                  {previewRegistration && (
                    <div style={{ marginTop: '1rem', position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={previewRegistration} 
                        alt="Registration document preview" 
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px', 
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0'
                        }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('registration')}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="dashboard-actions">
                  <button type="submit" className="action-button primary" disabled={uploading}>
                    {uploading ? 'Uploading Documents...' : 'Submit Documents'}
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

export default CompanyRegistrationPage;