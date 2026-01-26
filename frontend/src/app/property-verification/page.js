'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

const PropertyVerificationPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      
      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">Property Verification</h1>
              <p className="dashboard-subtitle">Register and verify your green assets</p>
            </div>
            
            <div className="dashboard-content">
              <div className="verification-steps">
                <div className="verification-step">
                  <h3>Step 1: Asset Information</h3>
                  <p>Provide details about your green asset (land, trees, plantation, etc.)</p>
                </div>
                
                <div className="verification-step">
                  <h3>Step 2: Documentation</h3>
                  <p>Upload supporting documents and images of your asset</p>
                </div>
                
                <div className="verification-step">
                  <h3>Step 3: AI Verification</h3>
                  <p>Our system will verify your asset using satellite imagery and AI</p>
                </div>
                
                <div className="verification-step">
                  <h3>Step 4: Carbon Credit Generation</h3>
                  <p>Receive verified carbon credits based on your asset's impact</p>
                </div>
              </div>
              
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

export default PropertyVerificationPage;