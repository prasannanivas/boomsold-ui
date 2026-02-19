import React, { useState, useEffect } from "react";
import "./PriceRequestModal.css";

const PriceRequestModal = ({ isOpen, onClose, type, neighborhoodName }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate Centris.ca URL based on neighborhood and property type
  const generateCentrisURL = () => {
    // Base Centris URL for Montreal real estate
    let baseURL = "https://www.centris.ca/en/properties~for-sale";
    
    // Add neighborhood/location parameter if available
    if (neighborhoodName) {
      const encodedNeighborhood = encodeURIComponent(neighborhoodName);
      baseURL += `~montreal-${encodedNeighborhood.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    } else {
      baseURL += "~montreal";
    }
    
    // Add property type filters
    if (type === "bungalow") {
      baseURL += "?view=Thumbnail&uc=0&category=1&condo=0&house=1&styleBuilding=Bungalow";
    } else if (type === "two-storey") {
      baseURL += "?view=Thumbnail&uc=0&category=1&condo=0&house=1&styleBuilding=Two-storey";
    } else if (type === "single-family") {
      baseURL += "?view=Thumbnail&uc=0&category=1&condo=0&house=1";
    } else if (type === "one-bedroom" || type === "3.5") {
      baseURL += "?view=Thumbnail&uc=0&category=1&condo=1&rooms=3.5";
    } else if (type === "two-bedroom" || type === "4.5") {
      baseURL += "?view=Thumbnail&uc=0&category=1&condo=1&rooms=4.5";
    } else if (type === "condo") {
      baseURL += "?view=Thumbnail&uc=0&category=1&condo=1";
    }
    
    return baseURL;
  };

  const centrisURL = generateCentrisURL();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Handle email submission for market updates
    const formData = {
      email,
      type,
      neighborhoodName,
      requestType: "market-updates",
      timestamp: new Date().toISOString(),
    };
    
    console.log("Email submitted for market updates:", formData);
    
    // TODO: Send to your backend API or email service
    // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(formData) });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    
    // Redirect to Centris
    window.open(centrisURL, "_blank");
    onClose();
  };

  const handleNoThanks = () => {
    // Redirect to Centris without email
    window.open(centrisURL, "_blank");
    onClose();
  };

  // Get property type display text
  const getPropertyTypeText = () => {
    const typeMap = {
      "bungalow": "Bungalows",
      "two-storey": "Two Storey Homes",
      "single-family": "Single Family Homes",
      "one-bedroom": "3½ Condos",
      "two-bedroom": "4½ Condos",
      "3.5": "3½ Condos",
      "4.5": "4½ Condos",
      "condo": "Condos",
    };
    return typeMap[type] || "Properties";
  };

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal-content centris-redirect-modal" onClick={(e) => e.stopPropagation()}>
        <button className="price-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="redirect-message-container">
          <div className="email-capture-section">
            <p className="email-capture-message">
              BEFORE YOU LEAVE, FEEL FREE TO LEAVE US YOUR EMAIL FOR MARKET UPDATES
            </p>
            
            <form onSubmit={handleEmailSubmit} className="email-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="price-modal-input"
                disabled={isSubmitting}
              />
              
              <button
                type="submit"
                className="price-modal-submit"
                disabled={!email || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit & Continue"}
              </button>
            </form>
          </div>

          <button
            type="button"
            className="no-thanks-button"
            onClick={handleNoThanks}
            disabled={isSubmitting}
          >
            No, thanks
          </button>

          <div className="centris-info-bottom">
            <p className="centris-redirect-notice">
              Redirecting to Centris.ca
            </p>
            <p className="property-type-info">
              {getPropertyTypeText()}
              {neighborhoodName && (
                <>
                  {" "}• {neighborhoodName}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceRequestModal;
