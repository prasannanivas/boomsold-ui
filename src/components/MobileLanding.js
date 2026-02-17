import React, { useState, useEffect, useRef, useCallback } from "react";
import "./MobileLanding.css";

const MobileLanding = ({ onExplore }) => {
  const [isExploring, setIsExploring] = useState(false);
  const landingRef = useRef(null);
  const startYRef = useRef(0);

  const handleExplore = useCallback(() => {
    if (!isExploring) {
      setIsExploring(true);
      // Wait for animation to complete before notifying parent
      setTimeout(() => {
        onExplore();
      }, 800);
    }
  }, [isExploring, onExplore]);

  const handleExploreClick = () => {
    handleExplore();
  };

  useEffect(() => {
    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = startYRef.current - currentY;
      
      // If user scrolls up more than 50px, trigger slide up
      if (deltaY > 50) {
        handleExplore();
      }
    };

    const handleWheel = (e) => {
      // If user scrolls down (positive deltaY), trigger slide up
      if (e.deltaY > 20) {
        handleExplore();
      }
    };

    const element = landingRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isExploring, handleExplore]);

  return (
    <div ref={landingRef} className={`mobile-landing ${isExploring ? "slide-up" : ""}`}>
      <div className="mobile-landing-content">
        <div className="mobile-logo">
          <img
            src={process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"}
            alt="BoomSold"
          />
        </div>

        <h1 className="mobile-agent-name">MIKHAIL STECHINE</h1>
        <p className="mobile-agent-title">COURTIER IMMOBILIER</p>

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
