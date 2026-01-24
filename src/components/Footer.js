import React from "react";
import { useTranslation } from "react-i18next";
import "./Footer.css";

const Footer = ({ onNavigate }) => {
  const { t } = useTranslation();
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
            <span onClick={() => handleNavigate("buy")} style={{ cursor: "pointer" }}>{t('footer.buy.title')}</span>
            <span onClick={() => handleNavigate("map")} style={{ cursor: "pointer" }}>{t('footer.buy.map')}</span>
          </div>
          <div className="link-col">
            <h4>{t('footer.sell.title')}</h4>
            <span onClick={() => handleNavigate("sell")} style={{ cursor: "pointer" }}>{t('footer.sell.title')}</span>
          </div>
          <div className="link-col">
            <h4>{t('footer.company.title')}</h4>
            <span onClick={() => handleNavigate("about")} style={{ cursor: "pointer" }}>{t('footer.company.about')}</span>
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
