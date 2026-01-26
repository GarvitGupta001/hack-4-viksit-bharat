'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="page-container">
      <Navbar />
      
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title" style={{color:"black"}}>Turn Your Green Assets Into Verified Carbon Credits</h1>
            <p className="hero-subtitle" style={{color:"black"}}>Plant trees, verify land, earn tradable carbon credits through AI-powered verification.</p>
            <div className="banner-placeholder">
              <img 
                style={{
                  width: "100%",
                  maxWidth: "1000px", 
                  height: "auto", 
                  borderStyle: "solid",
                  borderColor: "black",
                  borderWidth: "2px",
                  borderRadius: "2rem",
                  objectFit: "cover",
                  display: "block",
                  margin: "0 auto"
                }} 
                src="/banner.png" 
                alt="CarbonCoin Banner"
              />
            </div>
            <Link href="/signup" className="cta-button">
              Get Started
            </Link>
          </div>
        </section>

        {/* About Us Section */}
        <section className="about-section">
          <div className="container">
            <h2 className="section-title">About Us</h2>
            <section id="about" className="about-section">
  <h2>🌱 About CarbonCoin</h2>

  <p>
    CarbonCoin is a next-generation <strong>Carbon Capitalization Marketplace</strong> built to turn everyday
    environmental actions into <strong>verified, tradable value</strong>. We believe the carbon credit economy should
    not be limited to big institutions—<strong>individuals, small landowners, farmers, and local communities</strong>
    should be able to participate, earn rewards, and gain recognition for protecting the planet. 🌍✨
  </p>

  <p>
    Our platform allows users to register green assets like <strong>trees, land, and plantations</strong>, and submit
    supporting details for verification. Instead of slow and unreliable manual processes, CarbonCoin uses
    <strong>AI-powered verification</strong> combined with <strong>satellite imagery</strong> and
    <strong>geospatial monitoring</strong> to validate assets, reduce fraud, and build long-term trust. 🛰️📍🤖
  </p>

  <h3>✅ Register → 🛰️ Verify → 🪙 Earn</h3>
  <p>
    Once an asset is verified, users receive <strong>Carbon Coins</strong> — digital carbon credits issued based on the
    verified carbon offset potential of their green assets. This makes sustainability
    <strong>measurable, transparent, and rewarding</strong> for everyday contributors. 🌿✅
  </p>

  <p>
    At the same time, CarbonCoin creates a trusted marketplace for <strong>companies</strong> to access reliable,
    scalable carbon credits for sustainability goals and compliance. By connecting contributors and buyers on one
    verified platform, we make the carbon market more <strong>inclusive, credible, and impactful</strong>. 🏢📊✅
  </p>

  <p>
    CarbonCoin is not just a marketplace—it’s a movement to democratize climate action. Whether you plant trees, protect
    land, or support conservation, CarbonCoin helps you turn your green impact into real value while building a greener
    future for everyone. 🌎💚✨
  </p>
</section>
          
            <div className="features-grid" style={{marginTop: "3rem", marginBottom:"3rem"}}>
              <div className="feature-card">
                <h3 className="feature-title">Democratization</h3>
                <p className="feature-desc" style={{color: "black"}}>Making carbon markets accessible to individuals and small communities</p>
              </div>
              
              <div className="feature-card">
                <h3 className="feature-title">Verification via AI & Satellite</h3>
                <p className="feature-desc" style={{color: "black"}}>Using advanced technology to verify green assets accurately</p>
              </div>
              
              <div className="feature-card">
                <h3 className="feature-title">Monetization via Carbon Coins</h3>
                <p className="feature-desc" style={{color: "black"}}>Earn tradable carbon credits for your environmental contributions</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
