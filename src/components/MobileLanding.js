import React, { useState } from "react";
import "./MobileLanding.css";

const MobileLanding = ({ onExplore }) => {
  const [isExploring, setIsExploring] = useState(false);

  const handleExploreClick = () => {
    setIsExploring(true);
    // Wait for animation to complete before notifying parent
    setTimeout(() => {
      onExplore();
    }, 800);
  };

  return (
    <div className={`mobile-landing ${isExploring ? "slide-up" : ""}`}>
      <div className="mobile-landing-content">
        <div className="mobile-logo">
          <img
            src={process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"}
            alt="BoomSold"
          />
        </div>

        <h1 className="mobile-agent-name">MIKHAIL STECHINE</h1>
        <p className="mobile-agent-title">COURTIER IMMOBILIER</p>
        <p className="mobile-agent-phone">514-983-8459</p>

        <div className="mobile-bio">
          <p className="mobile-bio-label">mini bio/intro to your mainpage</p>
          <p className="mobile-bio-text">
            Hi, my name is Mikhail, i've <br />built this page to ca
          </p>
        </div>

        <button className="discover-button" onClick={handleExploreClick}>
          DISCOVER MONTREAL
        </button>
      </div>
    </div>
  );
};

export default MobileLanding;
