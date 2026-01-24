import React from "react";
import { useTranslation } from "react-i18next";
import "./InfoPage.css";

const BuyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page-container">
      <div className="info-page-content">
        <h1 className="info-page-title">{t('buyPage.title')}</h1>
        
        <div className="info-page-steps">
          <div className="info-page-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>{t('buyPage.step1.title')}</h3>
              <p>{t('buyPage.step1.description')}</p>
            </div>
          </div>

          <div className="info-page-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>{t('buyPage.step2.title')}</h3>
              <p>{t('buyPage.step2.description')}</p>
            </div>
          </div>

          <div className="info-page-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>{t('buyPage.step3.title')}</h3>
              <p>{t('buyPage.step3.description')}</p>
            </div>
          </div>

          <div className="info-page-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>{t('buyPage.step4.title')}</h3>
              <p>{t('buyPage.step4.description')}</p>
            </div>
          </div>

          <div className="info-page-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>{t('buyPage.step5.title')}</h3>
              <p>{t('buyPage.step5.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyPage;
