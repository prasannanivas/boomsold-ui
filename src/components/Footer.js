import React from "react";
import "./Footer.css";

const Footer = () => {
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  return (
    <footer className="main-footer">
      <div className="footer-content">
        {/* Logo Section */}
        <div className="footer-brand">
          <img src={logoUrl} alt="BoomSold" className="footer-logo" />
          <p className="footer-tagline">Montreal's Real Estate Authority</p>
        </div>

        {/* Links Section */}
        <div className="footer-links">
          <div className="link-col">
            <h4>Buy</h4>
            <span>Search</span>
            <span>Map</span>
            <span>Alerts</span>
          </div>
          <div className="link-col">
            <h4>Sell</h4>
            <span>Valuation</span>
            <span>Process</span>
            <span>Agents</span>
          </div>
          <div className="link-col">
            <h4>Company</h4>
            <span>About</span>
            <span>Careers</span>
            <span>Contact</span>
          </div>
        </div>

        {/* Newsletter Section (Variant 3) */}
        <div className="footer-newsletter">
          <h4>Stay Updated</h4>
          <div className="input-group">
            <input type="email" placeholder="Enter email..." />
            <button>Subscribe</button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <span className="copyright">© 2025 BoomSold Inc.</span>
        <div className="footer-socials">
          <span>FB</span>
          <span>IG</span>
          <span>LI</span>
          <span>TW</span>
        </div>
        <div className="legal-links">
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
