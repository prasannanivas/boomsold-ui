import React, { useState } from "react";
import "./PriceRequestModal.css";

const PriceRequestModal = ({ isOpen, onClose, type }) => {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const getMessage = () => {
    switch (type) {
      case "single-family":
        return "If you would like a list of the properties sold in the last 90 days, please leave us your email.";
      case "bungalow":
        return "If you would like a list of the bungalows sold in the last 90 days, please leave us your email.";
      case "two-storey":
        return "If you would like a list of the two-story houses sold in the last 90 days, please leave us your email.";
      case "condo":
        return "If you would like a list of the condos sold in the last 90 days, please leave us your email.";
      case "one-bedroom":
        return "If you would like to know the average price of 1 bedroom condos please leave us your email:";
      case "two-bedroom":
        return "If you would like to know the average price of 2 bedroom condos please leave us your email:";
      default:
        return "If you would like a list of the properties sold in the last 90 days, please leave us your email.";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., API call)
    console.log(`Email submitted for ${type}: ${email}`);
    // Reset and close
    setEmail("");
    setAgreed(false);
    onClose();
  };

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="price-modal-close" onClick={onClose}>
          ×
        </button>
        <p className="price-modal-message">{getMessage()}</p>

        <form onSubmit={handleSubmit}>
          <div className="price-modal-input-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="price-modal-input"
            />
          </div>

          <div className="price-modal-terms">
            <label>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="price-modal-submit"
            disabled={!agreed}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default PriceRequestModal;
