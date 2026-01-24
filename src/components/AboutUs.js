import React from "react";
import { useTranslation } from "react-i18next";
import "./InfoPage.css";

const AboutUs = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page-container">
      <div className="info-page-content">
        <h1 className="info-page-title">{t('aboutUs.title')}</h1>
        
        <div className="info-page-section">
          <p>{t('aboutUs.intro')}</p>
          
          <p>{t('aboutUs.paragraph1')}</p>
          
          <p>{t('aboutUs.paragraph2')}</p>
          
          <p>{t('aboutUs.paragraph3')}</p>
          
          <p>{t('aboutUs.paragraph4')}</p>
          
          <p>{t('aboutUs.closing')}</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
