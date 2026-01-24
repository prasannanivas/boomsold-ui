import React from "react";
import { useTranslation } from "react-i18next";
import "./InfoPage.css";

const SellPage = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page-container">
      <div className="info-page-content">
        <h1 className="info-page-title">{t('sellPage.title')}</h1>
        
        <div className="info-page-steps">
          <div className="info-page-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>{t('sellPage.step1.title')}</h3>
              <p>{t('sellPage.step1.description')}</p>
            </div>
          </div>

          <div className="info-page-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>{t('sellPage.step2.title')}</h3>
              <p>{t('sellPage.step2.description')}</p>
            </div>
          </div>

          <div className="info-page-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>{t('sellPage.step3.title')}</h3>
              <p>{t('sellPage.step3.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
