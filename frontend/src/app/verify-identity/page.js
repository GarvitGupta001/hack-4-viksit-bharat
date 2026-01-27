'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import apiClient from '../../services/api';

const VerifyIdentityPage = () => {
  const [aadhaarImage, setAadhaarImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [previewAadhaar, setPreviewAadhaar] = useState(null);
  const [previewSelfie, setPreviewSelfie] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const router = useRouter();

  const handleImageChange = (e, setImage, setPreview, type) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        setError(`${type} must be JPG or PNG format`);
        return;
      }

      // Set file object
      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'Aadhaar') {
          setPreviewAadhaar(reader.result);
        } else {
          setPreviewSelfie(reader.result);
        };
      };
      reader.readAsDataURL(file);

      // Clear error if previously set
      if (error) setError('');
    }
  };

  const handleVerify = async () => {
    // Validate both images are uploaded
    if (!aadhaarImage || !selfieImage) {
      setError('Please upload both Aadhaar and Selfie images');
      return;
    }

    // Show loading state
    setIsLoading(true);
    setVerificationStatus('');
    setError('');

    try {
      // Prepare documents for API
      const documents = {
        selfie: selfieImage,
        aadhar: aadhaarImage
      };

      // Call API to upload documents
      const response = await apiClient.uploadSellerDocuments(documents);

      // Set success state
      setIsLoading(false);
      setVerificationStatus('Verified ✅');

      // Save verification status to localStorage
      localStorage.setItem('identityVerified', 'true');
      localStorage.setItem('carbonCoins', response.data.carbonCoins || 0);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Verification error:', error);
      setIsLoading(false);
      setError(error.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        <div className="auth-container">
          <div className="auth-form">
            <h1 className="form-title">Identity Verification</h1>
            <p className="subtitle">Upload Aadhaar and a Selfie to verify your identity</p>

            {error && <div className="error-message">{error}</div>}
            {verificationStatus && <div className="success-message">{verificationStatus}</div>}

            <div className="upload-section">
              <div className="upload-group">
                <label className="upload-label">Aadhaar Image Upload (jpg/png only)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleImageChange(e, setAadhaarImage, setPreviewAadhaar, 'Aadhaar')}
                  className="upload-input"
                  disabled={isLoading}
                />
                {previewAadhaar && (
                  <div className="image-preview">
                    <img src={previewAadhaar} alt="Aadhaar Preview" className="preview-image" />
                  </div>
                )}
              </div>

              <div className="upload-group">
                <label className="upload-label">Selfie Image Upload (jpg/png only)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleImageChange(e, setSelfieImage, setPreviewSelfie, 'Selfie')}
                  className="upload-input"
                  disabled={isLoading}
                />
                {previewSelfie && (
                  <div className="image-preview">
                    <img src={previewSelfie} alt="Selfie Preview" className="preview-image" />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleVerify}
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>
                  Processing… <span className="spinner">⏳</span>
                </span>
              ) : (
                'Verify Now'
              )}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyIdentityPage;