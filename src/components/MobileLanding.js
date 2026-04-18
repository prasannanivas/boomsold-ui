import React from "react";
import "./MobileLanding.css";

const MobileLanding = ({ onExplore, onNavigate }) => {
  return (
    <div className="mobile-landing">

      {/* ── FIRST SCREEN: photo + info up to description (100dvh) ── */}
      <div className="mobile-landing-first-screen">
        {/* Broker photo with overlay badge */}
        <div className="mobile-landing-photo-section">
          <div className="mobile-landing-broker-badge">
            <img
              src={process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG SMALL.png"}
              alt="BoomSold"
              className="ml-badge-logo"
            />
            <div className="ml-badge-info">
              <span className="ml-broker-name">MIKHAIL<br />STECHINE</span>
              <span className="ml-broker-title">
                Courtier Immobilier Résidentiel &amp; Commercial<br />
                Residential &amp; Commercial Real Estate Broker
              </span>
              <span className="ml-broker-phone">514-983-8459</span>
            </div>
          </div>
          <img
            src={process.env.PUBLIC_URL + "/assets/michaImage.png"}
            alt="Mikhail Stechine"
            className="mobile-landing-broker-photo"
          />
        </div>

        {/* Info: logo + tagline + description */}
        <div className="mobile-landing-info-section">
          <img
            src={process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"}
            alt="BoomSold"
            className="ml-main-logo"
          />
          <p className="ml-tagline">BoomSold — The Smarter Way to Move</p>
          <p className="ml-description">
            Hello, and welcome to my real estate website. I've created this
            platform to help you navigate the Montreal market with ease.
          </p>
        </div>
      </div>

      {/* ── ACTION CARDS: appear after scrolling ── */}
      <div className="ml-buttons-section">
        <button className="ml-action-btn" onClick={onExplore}>
          <span className="ml-btn-title">Find Homes by Area</span>
          <span className="ml-btn-sub">We filter the market for you…</span>
        </button>
        <button className="ml-action-btn" onClick={onExplore}>
          <span className="ml-btn-title">Get My Home Value</span>
          <span className="ml-btn-sub">Access market data + personalized insights</span>
        </button>
        <button className="ml-action-btn" onClick={onExplore}>
          <span className="ml-btn-title">Explore Investments</span>
          <span className="ml-btn-sub">Properties with strong potential based on market trends</span>
        </button>
        <button className="ml-action-btn" onClick={onExplore}>
          <span className="ml-btn-title">Browse Rentals</span>
          <span className="ml-btn-sub">Find the perfect rental in your area</span>
        </button>
      </div>

    </div>
  );
};

export default MobileLanding;
