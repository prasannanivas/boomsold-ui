import React from "react";
import "./HeaderPalette.css";

const HeaderPalette = () => {
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  const variants = [
    { id: 1, name: "Classic Center", desc: "Standard black with gold border" },
    { id: 2, name: "Minimal Left", desc: "Clean black, logo left" },
    { id: 3, name: "Gold Rush", desc: "Full gold background" },
    { id: 4, name: "Double Decker", desc: "Top bar info + Main header" },
    { id: 5, name: "Glassmorphism", desc: "Blur effect overlay" },
    { id: 6, name: "Floating Pill", desc: "Rounded floating container" },
    { id: 7, name: "Split Action", desc: "Logo left, CTA right" },
    { id: 8, name: "Underline Glow", desc: "Glowing bottom border" },
    { id: 9, name: "Boxed Elegant", desc: "Contained width with border" },
    { id: 10, name: "Gradient Fade", desc: "Black to transparent gradient" },
    { id: 11, name: "Sidebar Trigger", desc: "With hamburger menu icon" },
    { id: 12, name: "Social Stack", desc: "Social icons integrated" },
    { id: 13, name: "Mega Search", desc: "With search bar focus" },
    { id: 14, name: "Slimline", desc: "Compact height" },
    { id: 15, name: "Hero Integrated", desc: "Transparent for hero images" },
    { id: 16, name: "Neon Night", desc: "Strong neon gold effects" },
    { id: 17, name: "Corporate Clean", desc: "Grey tones with gold accent" },
    { id: 18, name: "Retro Bold", desc: "Thick borders and shadows" },
    { id: 19, name: "Asymmetric", desc: "Angled background shape" },
    { id: 20, name: "Luxury Pattern", desc: "Subtle pattern background" },
  ];

  return (
    <div className="header-palette-container">
      <h1 className="palette-title">Header Design Palette</h1>
      <p className="palette-subtitle">20 Variations of BoomSold Identity</p>

      <div className="palette-grid">
        {variants.map((variant) => (
          <div key={variant.id} className="palette-item">
            <div className="palette-label">
              <span className="variant-number">#{variant.id}</span>
              <span className="variant-name">{variant.name}</span>
              <span className="variant-desc">{variant.desc}</span>
            </div>

            <div
              className={`header-preview-container variant-${variant.id}-container`}
            >
              {/* Header Implementation */}
              <header className={`palette-header header-variant-${variant.id}`}>
                {/* Variant specific extra elements (Top bars, backgrounds) */}
                {variant.id === 4 && (
                  <div className="top-bar">
                    <span>📞 514-555-0123</span>
                    <span>✉️ info@boomsold.ca</span>
                  </div>
                )}
                {variant.id === 19 && <div className="asymmetric-bg"></div>}

                <div className="header-inner">
                  {/* Left Elements (Hamburger, Socials, etc) */}
                  {(variant.id === 11 || variant.id === 18) && (
                    <div className="icon-btn">☰</div>
                  )}
                  {variant.id === 12 && (
                    <div className="social-icons">
                      <span>FB</span>
                      <span>IG</span>
                      <span>LI</span>
                    </div>
                  )}

                  {/* Logo */}
                  <div className="logo-wrapper">
                    <img
                      src={logoUrl}
                      alt="BoomSold"
                      className="palette-logo"
                    />
                  </div>

                  {/* Right Elements (Nav, Search, CTA) */}
                  {[
                    2, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                  ].includes(variant.id) && (
                    <nav className="palette-nav">
                      <span className="nav-link">Buy</span>
                      <span className="nav-link">Sell</span>
                      <span className="nav-link">Map</span>
                    </nav>
                  )}

                  {variant.id === 7 && (
                    <button className="cta-btn">Get Started</button>
                  )}
                  {variant.id === 13 && (
                    <div className="search-bar">🔍 Search neighborhoods...</div>
                  )}
                  {variant.id === 16 && (
                    <button className="neon-btn">ENTER</button>
                  )}
                </div>
              </header>

              {/* Mock Content to show transparency/overlay effects */}
              <div className="mock-content">
                <div className="mock-hero-text">Content Area</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeaderPalette;
