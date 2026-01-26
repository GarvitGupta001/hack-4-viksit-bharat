'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

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

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Set success state
    setIsLoading(false);
    setVerificationStatus('Verified ✅');

    // Save verification status to localStorage
    localStorage.setItem('identityVerified', 'true');

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="page-container">
      <Navbar />
      
      <main className="main-content">
        <div className="auth-container">
          <div className="auth-form">
            <h1 className="form-title">Identity Verification</h1>
            <p className="subtitle">Upload Aadhaar and a Selfie to verify your identity (Demo UI)</p>
            
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