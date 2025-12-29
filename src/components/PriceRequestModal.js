import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./PriceRequestModal.css";

const PriceRequestModal = ({ isOpen, onClose, type }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const getMessage = () => {
    switch (type) {
      case "single-family":
        return t('priceRequestModal.messages.singleFamily');
      case "bungalow":
        return t('priceRequestModal.messages.bungalow');
      case "two-storey":
        return t('priceRequestModal.messages.twoStorey');
      case "condo":
        return t('priceRequestModal.messages.condo');
      case "one-bedroom":
        return t('priceRequestModal.messages.oneBedroom');
      case "two-bedroom":
        return t('priceRequestModal.messages.twoBedroom');
      default:
        return t('priceRequestModal.messages.singleFamily');
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
              placeholder={t('priceRequestModal.emailPlaceholder')}
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
                {t('priceRequestModal.agreeText')}{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  {t('priceRequestModal.termsLink')}
                </a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="price-modal-submit"
            disabled={!agreed}
          >
            {t('priceRequestModal.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PriceRequestModal;
