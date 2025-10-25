import React, { useState, useEffect } from "react";
import "./HelpGuide.css";

const HelpGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    // Check if user has seen the guide before
    const seen = localStorage.getItem("boomsold_guide_seen");
    if (!seen) {
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      setHasSeenGuide(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("boomsold_guide_seen", "true");
    setHasSeenGuide(true);
  };

  const handleShowGuide = () => {
    setIsVisible(true);
  };

  if (!isVisible && hasSeenGuide) {
    return (
      <button
        className="help-button"
        onClick={handleShowGuide}
        title="Show Guide"
      >
        ?
      </button>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="help-guide-overlay">
      <div className="help-guide-content">
        <button className="help-close-button" onClick={handleClose}>
          ✕
        </button>

        <h1 className="help-title">Welcome to BoomSold! 💥🏆</h1>
        <p className="help-subtitle">
          Your Premium Montreal Real Estate Experience
        </p>

        <div className="help-steps">
          <div className="help-step">
            <div className="help-step-number">1</div>
            <div className="help-step-content">
              <h3>Select a Region</h3>
              <p>
                Click on North, South, East, or West Montreal to explore
                neighborhoods
              </p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-number">2</div>
            <div className="help-step-content">
              <h3>Hover Over Neighborhoods</h3>
              <p>
                Move your cursor over any neighborhood to see prices and
                amenities instantly
              </p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-number">3</div>
            <div className="help-step-content">
              <h3>Click to Pin Details</h3>
              <p>
                Click any neighborhood to pin its details and explore it in
                depth
              </p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-number">4</div>
            <div className="help-step-content">
              <h3>Navigate Back</h3>
              <p>Use the back arrow to return to previous views anytime</p>
            </div>
          </div>
        </div>

        <button className="help-get-started" onClick={handleClose}>
          Get Started! 🚀
        </button>
      </div>
    </div>
  );
};

export default HelpGuide;
