'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AboutPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      
      <main className="main-content">
        <section className="about-page-section">
          <div className="container">
            <h1 className="page-title">About CarbonCoin</h1>
            <p className="about-description">
              We are building a marketplace that allows individuals and small communities to register green assets (trees/land/plantations), 
              verify them using AI + satellite imagery, and earn carbon credits (Carbon Coins). This makes carbon markets accessible to everyone, 
              not only big institutions.
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <h3 className="feature-title">Democratization</h3>
                <p className="feature-desc">Making carbon markets accessible to individuals and small communities</p>
              </div>
              
              <div className="feature-card">
                <h3 className="feature-title">Verification via AI & Satellite</h3>
                <p className="feature-desc">Using advanced technology to verify green assets accurately</p>
              </div>
              
              <div className="feature-card">
                <h3 className="feature-title">Monetization via Carbon Coins</h3>
                <p className="feature-desc">Earn tradable carbon credits for your environmental contributions</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutPage;