import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./PriceRequestModal.css";

const PriceRequestModal = ({ isOpen, onClose, type }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  // Form data for Single Family Homes
  const [homeType, setHomeType] = useState("");
  const [homeStyle, setHomeStyle] = useState("");
  const [intent, setIntent] = useState("");
  const [reportPeriod, setReportPeriod] = useState("");
  
  // Form data for Condos
  const [condoSize, setCondoSize] = useState("");

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail("");
      setAgreed(false);
      setHomeType("");
      setHomeStyle("");
      setIntent("");
      setReportPeriod("");
      setCondoSize("");
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  // Determine if it's a single-family or condo type
  const isSingleFamily = ["single-family", "bungalow", "two-storey"].includes(type);
  const isCondo = ["condo", "one-bedroom", "two-bedroom"].includes(type);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., API call)
    const formData = {
      type,
      email,
      ...(isSingleFamily && {
        homeType,
        homeStyle,
        intent,
        reportPeriod,
      }),
      ...(isCondo && {
        condoSize,
        intent,
        reportPeriod,
      }),
    };
    console.log("Form submitted:", formData);
    // Reset and close
    onClose();
  };

  const renderStepContent = () => {
    // Step 1: Initial message and property type questions
    if (step === 1) {
      return (
        <>
          <p className="price-modal-message">
            {t('priceRequestModal.marketAnalysisMessage')}
          </p>

          {isSingleFamily && (
            <div className="price-modal-question-group">
              <h3 className="price-modal-question">{t('priceRequestModal.questions.homeType')}</h3>
              <div className="price-modal-options">
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="homeType"
                    value="detached"
                    checked={homeType === "detached"}
                    onChange={(e) => setHomeType(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.detached')}</span>
                </label>
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="homeType"
                    value="attached"
                    checked={homeType === "attached"}
                    onChange={(e) => setHomeType(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.attached')}</span>
                </label>
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="homeType"
                    value="both"
                    checked={homeType === "both"}
                    onChange={(e) => setHomeType(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.both')}</span>
                </label>
              </div>

              <h3 className="price-modal-question">{t('priceRequestModal.questions.homeStyle')}</h3>
              <div className="price-modal-options">
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="homeStyle"
                    value="bungalow"
                    checked={homeStyle === "bungalow"}
                    onChange={(e) => setHomeStyle(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.bungalow')}</span>
                </label>
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="homeStyle"
                    value="twoStorey"
                    checked={homeStyle === "twoStorey"}
                    onChange={(e) => setHomeStyle(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.twoStorey')}</span>
                </label>
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="homeStyle"
                    value="bothStyles"
                    checked={homeStyle === "bothStyles"}
                    onChange={(e) => setHomeStyle(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.bothStyles')}</span>
                </label>
              </div>
            </div>
          )}

          {isCondo && (
            <div className="price-modal-question-group">
              <h3 className="price-modal-question">{t('priceRequestModal.questions.condoSize')}</h3>
              <div className="price-modal-options">
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="condoSize"
                    value="1bedroom"
                    checked={condoSize === "1bedroom"}
                    onChange={(e) => setCondoSize(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.oneBedroom')}</span>
                </label>
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="condoSize"
                    value="2bedroom"
                    checked={condoSize === "2bedroom"}
                    onChange={(e) => setCondoSize(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.twoBedroom')}</span>
                </label>
                <label className="price-modal-option">
                  <input
                    type="radio"
                    name="condoSize"
                    value="2bedroomPlus"
                    checked={condoSize === "2bedroomPlus"}
                    onChange={(e) => setCondoSize(e.target.value)}
                  />
                  <span>{t('priceRequestModal.options.twoBedroomPlus')}</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="button"
            className="price-modal-submit"
            onClick={handleNext}
            disabled={
              (isSingleFamily && (!homeType || !homeStyle)) ||
              (isCondo && !condoSize)
            }
          >
            {t('priceRequestModal.next')}
          </button>
        </>
      );
    }

    // Step 2: Intent and report period
    if (step === 2) {
      return (
        <>
          <div className="price-modal-question-group">
            <h3 className="price-modal-question">{t('priceRequestModal.questions.intent')}</h3>
            <div className="price-modal-options">
              <label className="price-modal-option">
                <input
                  type="radio"
                  name="intent"
                  value="buy"
                  checked={intent === "buy"}
                  onChange={(e) => setIntent(e.target.value)}
                />
                <span>{t('priceRequestModal.options.buy')}</span>
              </label>
              <label className="price-modal-option">
                <input
                  type="radio"
                  name="intent"
                  value="sell"
                  checked={intent === "sell"}
                  onChange={(e) => setIntent(e.target.value)}
                />
                <span>{t('priceRequestModal.options.sell')}</span>
              </label>
              <label className="price-modal-option">
                <input
                  type="radio"
                  name="intent"
                  value="exploring"
                  checked={intent === "exploring"}
                  onChange={(e) => setIntent(e.target.value)}
                />
                <span>{t('priceRequestModal.options.exploring')}</span>
              </label>
            </div>

            <h3 className="price-modal-question">{t('priceRequestModal.questions.reportPeriod')}</h3>
            <div className="price-modal-options">
              <label className="price-modal-option">
                <input
                  type="radio"
                  name="reportPeriod"
                  value="90days"
                  checked={reportPeriod === "90days"}
                  onChange={(e) => setReportPeriod(e.target.value)}
                />
                <span>{t('priceRequestModal.options.90days')}</span>
              </label>
              <label className="price-modal-option">
                <input
                  type="radio"
                  name="reportPeriod"
                  value="180days"
                  checked={reportPeriod === "180days"}
                  onChange={(e) => setReportPeriod(e.target.value)}
                />
                <span>{t('priceRequestModal.options.180days')}</span>
              </label>
              <label className="price-modal-option">
                <input
                  type="radio"
                  name="reportPeriod"
                  value="1year"
                  checked={reportPeriod === "1year"}
                  onChange={(e) => setReportPeriod(e.target.value)}
                />
                <span>{t('priceRequestModal.options.1year')}</span>
              </label>
            </div>
          </div>

          <div className="price-modal-button-group">
            <button
              type="button"
              className="price-modal-back"
              onClick={handleBack}
            >
              {t('priceRequestModal.back')}
            </button>
            <button
              type="button"
              className="price-modal-submit"
              onClick={handleNext}
              disabled={!intent || !reportPeriod}
            >
              {t('priceRequestModal.next')}
            </button>
          </div>
        </>
      );
    }

    // Step 3: Email and terms
    if (step === 3) {
      return (
        <form onSubmit={handleSubmit}>
          <p className="price-modal-message">
            {t('priceRequestModal.emailMessage')}
          </p>

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

          <div className="price-modal-button-group">
            <button
              type="button"
              className="price-modal-back"
              onClick={handleBack}
            >
              {t('priceRequestModal.back')}
            </button>
            <button
              type="submit"
              className="price-modal-submit"
              disabled={!agreed || !email}
            >
              {t('priceRequestModal.submit')}
            </button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="price-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="price-modal-progress">
          <div className={`price-modal-progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`price-modal-progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`price-modal-progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`price-modal-progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`price-modal-progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
};

export default PriceRequestModal;
