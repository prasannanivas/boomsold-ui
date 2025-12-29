import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./HelpGuide.css";

const HelpGuide = () => {
  const { t } = useTranslation();
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

        <h1 className="help-title">{t('helpGuide.welcome')}</h1>
        <p className="help-subtitle">
          {t('helpGuide.subtitle')}
        </p>

        <div className="help-steps">
          <div className="help-step">
            <div className="help-step-number">1</div>
            <div className="help-step-content">
              <h3>{t('helpGuide.step1.title')}</h3>
              <p>
                {t('helpGuide.step1.description')}
              </p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-number">2</div>
            <div className="help-step-content">
              <h3>{t('helpGuide.step2.title')}</h3>
              <p>
                {t('helpGuide.step2.description')}
              </p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-number">3</div>
            <div className="help-step-content">
              <h3>{t('helpGuide.step3.title')}</h3>
              <p>
                {t('helpGuide.step3.description')}
              </p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-number">4</div>
            <div className="help-step-content">
              <h3>{t('helpGuide.step4.title')}</h3>
              <p>{t('helpGuide.step4.description')}</p>
            </div>
          </div>
        </div>

        <button className="help-get-started" onClick={handleClose}>
          {t('helpGuide.getStarted')}
        </button>
      </div>
    </div>
  );
};

export default HelpGuide;
