import React from "react";
import { useTranslation } from "react-i18next";
import "./Footer.css";

const Footer = () => {
  const { t } = useTranslation();
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  return (
    <footer className="main-footer">
      <div className="footer-content">
        {/* Logo Section */}
        <div className="footer-brand">
          <img src={logoUrl} alt="BoomSold" className="footer-logo" />
          <p className="footer-tagline">{t('footer.tagline')}</p>
        </div>

        {/* Links Section */}
        <div className="footer-links">
          <div className="link-col">
            <h4>{t('footer.buy.title')}</h4>
            <span>{t('footer.buy.search')}</span>
            <span>{t('footer.buy.map')}</span>
            <span>{t('footer.buy.alerts')}</span>
          </div>
          <div className="link-col">
            <h4>{t('footer.sell.title')}</h4>
            <span>{t('footer.sell.valuation')}</span>
            <span>{t('footer.sell.process')}</span>
            <span>{t('footer.sell.agents')}</span>
          </div>
          <div className="link-col">
            <h4>{t('footer.company.title')}</h4>
            <span>{t('footer.company.about')}</span>
            <span>{t('footer.company.careers')}</span>
            <span>{t('footer.company.contact')}</span>
          </div>
        </div>

        {/* Newsletter Section (Variant 3) */}
        <div className="footer-newsletter">
          <h4>{t('footer.newsletter.title')}</h4>
          <div className="input-group">
            <input type="email" placeholder={t('footer.newsletter.placeholder')} />
            <button>{t('footer.newsletter.button')}</button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <span className="copyright">{t('footer.copyright')}</span>
        <div className="footer-socials">
          <span>FB</span>
          <span>IG</span>
          <span>LI</span>
          <span>TW</span>
        </div>
        <div className="legal-links">
          <span>{t('footer.legal.privacy')}</span>
          <span>{t('footer.legal.terms')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
