'use client';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-meta">
          <p style={{ margin: 0, marginBottom: '0.5rem' }}>
            © 2026 CarbonCoin Marketplace
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
            Empowering carbon credit trading for a sustainable future.
          </p>
        </div>

        <div className="footer-columns">
          <div className="footer-column">
            <div className="footer-column-title">Product</div>
            <div className="footer-links">
              <a href="#" className="footer-link">
                Overview
              </a>
              <a href="#" className="footer-link">
                Features
              </a>
              <a href="#" className="footer-link">
                Pricing
              </a>
            </div>
          </div>

          <div className="footer-column">
            <div className="footer-column-title">Company</div>
            <div className="footer-links">
              <a href="#" className="footer-link">
                About
              </a>
              <a href="#" className="footer-link">
                Blog
              </a>
              <a href="#" className="footer-link">
                Careers
              </a>
            </div>
          </div>

          <div className="footer-column">
            <div className="footer-column-title">Legal</div>
            <div className="footer-links">
              <a href="#" className="footer-link">
                Privacy
              </a>
              <a href="#" className="footer-link">
                Terms
              </a>
              <a href="#" className="footer-link">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;