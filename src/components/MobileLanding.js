import React from "react";
import "./MobileLanding.css";

const MobileLanding = ({ onExplore }) => {
  return (
    <div className="mobile-landing">
      <div className="mobile-landing-content">
        <div className="mobile-logo">
          <img
            src={process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"}
            alt="BoomSold"
          />
        </div>

        <h1 className="mobile-agent-name">MIKHAIL STECHINE</h1>
        <p className="mobile-agent-title">REAL ESTATE BROKER</p>

        <div className="mobile-bio">
          <p className="mobile-bio-text">
            Hello, my name is Mikhail Stechine and I have built this website to simplify your real estate journey.
          </p>
        </div>

        <div className="scroll-indicator">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M40 15 L40 55 M40 55 L25 40 M40 55 L55 40" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MobileLanding;
