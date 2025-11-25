import React from "react";
import "./FooterPalette.css";

const FooterPalette = () => {
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  const variants = [
    {
      id: 1,
      name: "Classic 3-Column",
      desc: "Standard layout with logo, links, and contact",
    },
    { id: 2, name: "Centered Minimal", desc: "Logo and copyright centered" },
    { id: 3, name: "Newsletter Focus", desc: "Prominent subscription field" },
    {
      id: 4,
      name: "Social Bar",
      desc: "Horizontal layout with big social icons",
    },
    {
      id: 5,
      name: "Gold Border Top",
      desc: "Black with distinct gold accent line",
    },
    { id: 6, name: "Corporate Grid", desc: "Structured 4-column information" },
    { id: 7, name: "App Download", desc: "Links to mobile stores" },
    { id: 8, name: "Tagline Hero", desc: "Large brand statement" },
    { id: 9, name: "Contact Strip", desc: "Horizontal contact details" },
    { id: 10, name: "Legal & Trust", desc: "With badges and disclaimers" },
    { id: 11, name: "Asymmetric Top", desc: "Angled design element" },
    { id: 12, name: "Gradient Depth", desc: "Subtle background gradient" },
    { id: 13, name: "Map Integrated", desc: "With mini location preview" },
    { id: 14, name: "Luxury Pattern", desc: "Subtle texture background" },
    { id: 15, name: "Floating Card", desc: "Detached from bottom edge" },
    { id: 16, name: "The Real Deal", desc: "Clean text-based layout" },
    { id: 17, name: "Split Level", desc: "Top/Bottom split layout" },
    { id: 18, name: "Agency Focus", desc: "Highlighting Montreal" },
    { id: 19, name: "Creator Credit", desc: "Focus on Made with Love" },
    { id: 20, name: "Legal Center", desc: "Centered legal notice" },
  ];

  return (
    <div className="footer-palette-container">
      <h1 className="palette-title">Footer Design Palette</h1>
      <p className="palette-subtitle">20 Variations of BoomSold Footer</p>

      <div className="palette-grid">
        {variants.map((variant) => (
          <div key={variant.id} className="palette-item">
            <div className="palette-label">
              <span className="variant-number">#{variant.id}</span>
              <span className="variant-name">{variant.name}</span>
              <span className="variant-desc">{variant.desc}</span>
            </div>

            <div
              className={`footer-preview-container variant-${variant.id}-container`}
            >
              <footer className={`palette-footer footer-variant-${variant.id}`}>
                {/* Variant 11 Asymmetric Background */}
                {variant.id === 11 && <div className="footer-angle"></div>}

                {/* Variants 16-20: Custom Structure based on Image */}
                {[16, 17, 18, 19, 20].includes(variant.id) ? (
                  <div className="custom-footer-structure">
                    <div className="footer-top-row">
                      <div className="footer-left-group">
                        <div className="ali-chris-logo">
                          BOOM SOLD{" "}
                          <span className="sub-text">
                            REAL ESTATE | IMMOBILIER
                          </span>
                        </div>
                        <div className="agency-name">MONTREAL</div>
                      </div>
                      <div className="footer-right-group">
                        <div className="social-icons-minimal">
                          <span>f</span>
                          <span>▶</span>
                          <span>📷</span>
                          <span>in</span>
                        </div>
                      </div>
                    </div>

                    <div className="footer-divider"></div>

                    <div className="footer-bottom-row">
                      <div className="phone-number">(514) 555-0123</div>
                      <div className="copyright-legal">
                        <div>© 2025 BoomSold Inc.</div>
                        <div className="legal-notice">Legal notice</div>
                      </div>
                      <div className="made-by-section">
                        <div>
                          Made with <span style={{ color: "red" }}>♥</span> in
                          Montreal
                        </div>
                        <div className="neighborhoods-link">
                          Neighborhoods we specialize in ▼
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="footer-content">
                      {/* Logo Section */}
                      <div className="footer-brand">
                        <img
                          src={logoUrl}
                          alt="BoomSold"
                          className="footer-logo"
                        />
                        {[1, 6, 8, 13].includes(variant.id) && (
                          <p className="footer-tagline">
                            Montreal's Real Estate Authority
                          </p>
                        )}
                      </div>

                      {/* Links Section - Conditional based on variant */}
                      {[1, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15].includes(
                        variant.id
                      ) && (
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
                          {[6, 10, 13, 14].includes(variant.id) && (
                            <div className="link-col">
                              <h4>Company</h4>
                              <span>About</span>
                              <span>Careers</span>
                              <span>Contact</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Special Features */}
                      {variant.id === 3 && (
                        <div className="footer-newsletter">
                          <h4>Stay Updated</h4>
                          <div className="input-group">
                            <input type="email" placeholder="Enter email..." />
                            <button>Subscribe</button>
                          </div>
                        </div>
                      )}

                      {variant.id === 7 && (
                        <div className="app-buttons">
                          <div className="app-btn"> App Store</div>
                          <div className="app-btn">▶ Google Play</div>
                        </div>
                      )}

                      {variant.id === 9 && (
                        <div className="contact-row">
                          <span>📞 514-555-0123</span>
                          <span>✉️ info@boomsold.ca</span>
                          <span>📍 1234 Main St, Montreal</span>
                        </div>
                      )}

                      {variant.id === 13 && (
                        <div className="footer-map-preview">
                          <div className="map-placeholder">📍 Map View</div>
                        </div>
                      )}
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
                      {[10, 13, 14].includes(variant.id) && (
                        <div className="legal-links">
                          <span>Privacy</span>
                          <span>Terms</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </footer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FooterPalette;
