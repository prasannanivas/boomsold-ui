import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Header.css";

const Header = ({ onNavigate, currentPage }) => {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsSidebarOpen(false);
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <>
      <header className="main-header">
        {/* Top Bar (From Variant 4) */}
        <div className="header-top-bar">
          <span>{t('header.phone')}</span>
          <span>{t('header.email')}</span>
        </div>

        {/* Main Header Content */}
        <div className="header-main">
          <div className="header-left">
            {/* Sidebar Trigger (From Variant 11) */}
            <div className="sidebar-trigger" onClick={toggleSidebar}>
              ☰
            </div>

             <div
        style={{
          position: "absolute",
          top: isMobile ? "35px" : "20px",
          left: isMobile ? "auto" : "90px",
          right: isMobile ? "0px" : "auto",
          width: isMobile ? "100px" : "100px",
          height: isMobile ? "65px" : "65px",
          zIndex: 1500,
        }}
      >
        {/* BoomSold Logo */}
        <div
          style={{
            width: "100%",
            height: isMobile ? "60px" : "100px",
            borderRadius: "8px",
            padding: "5px",
          }}
        >
          <img
            src={
              process.env.PUBLIC_URL +
              "/assets/BOOM SOLD LOGO 2025 YELLOW PNG SMALL.png"
            }
            alt="Boom Sold Logo"
            className="boomsold-logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>
          </div>

          {/* Navigation (From Variant 4) */}
          <nav className="header-nav">
            <span className="nav-item" onClick={() => handleNavigate("buy")} style={{ cursor: "pointer" }}>{t('header.nav.buy')}</span>
            <span className="nav-item" onClick={() => handleNavigate("sell")} style={{ cursor: "pointer" }}>{t('header.nav.sell')}</span>
            <span className="nav-item" onClick={() => handleNavigate("map")} style={{ cursor: "pointer" }}>{t('header.nav.map')}</span>
            <div className="language-switcher">
              <button 
                onClick={() => changeLanguage('en')} 
                className={i18n.language === 'en' ? 'active' : ''}
              >
                EN
              </button>
              <span className="lang-separator">|</span>
              <button 
                onClick={() => changeLanguage('fr')} 
                className={i18n.language === 'fr' ? 'active' : ''}
              >
                FR
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={toggleSidebar}
      ></div>
      <div className={`sidebar-menu ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="close-btn" onClick={toggleSidebar}>
            ×
          </span>
        </div>
        <ul className="sidebar-links">
          <li onClick={() => handleNavigate("buy")}>{t('header.sidebar.buy')}</li>
          <li onClick={() => handleNavigate("sell")}>{t('header.sidebar.sell')}</li>
          <li onClick={() => handleNavigate("about")}>{t('header.sidebar.aboutUs')}</li>
          <li onClick={() => handleNavigate("map")}>{t('header.nav.map')}</li>
          <li>
            <div className="sidebar-language">
              <span>{t('header.sidebar.language')}: </span>
              <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
              <span> / </span>
              <button onClick={() => changeLanguage('fr')} className={i18n.language === 'fr' ? 'active' : ''}>FR</button>
            </div>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Header;
