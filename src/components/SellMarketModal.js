import React, { useState, useEffect } from "react";
import "./SellMarketModal.css";

const SellMarketModal = ({ isOpen, onClose, neighborhoodName }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate Centris URL for market statistics
  const generateCentrisURL = () => {
    let baseURL = "https://www.centris.ca/en/properties~for-sale";
    if (neighborhoodName) {
      const encoded = encodeURIComponent(neighborhoodName)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      baseURL += `~montreal-${encoded}`;
    } else {
      baseURL += "~montreal";
    }
    return baseURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const formData = {
      email,
      neighborhoodName,
      requestType: "sell-market-data",
      timestamp: new Date().toISOString(),
    };

    console.log("Sell market data email submitted:", formData);

    // TODO: Send to backend API
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsSubmitting(false);

    // Redirect to Centris market stats
    window.open(generateCentrisURL(), "_blank");
    onClose();
  };

  return (
    <div className="smm-overlay" onClick={onClose}>
      <div className="smm-content" onClick={(e) => e.stopPropagation()}>
        <button className="smm-close" onClick={onClose}>×</button>

        <div className="smm-step">
          <h2 className="smm-title">View Market Statistics</h2>
          {neighborhoodName && (
            <p className="smm-neighborhood">{neighborhoodName}</p>
          )}

          <form onSubmit={handleSubmit} className="smm-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="smm-email-input"
              autoComplete="email"
              autoFocus
              disabled={isSubmitting}
            />

            <button
              type="submit"
              className="smm-cta-button"
              disabled={!email || isSubmitting}
            >
              {isSubmitting ? "Unlocking..." : "UNLOCK MARKET DATA"}
            </button>
          </form>

          <p className="smm-disclaimer">
            By continuing, you agree to receive emails from BoomSold, including a 
            personalized market report based on the last 90 days of activity in your 
            selected area. You'll be redirected to view detailed market statistics 
            sourced from Centris. You can unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellMarketModal;
