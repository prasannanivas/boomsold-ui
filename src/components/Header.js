import React, { useState } from "react";
import "./Header.css";

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <header className="main-header">
        {/* Top Bar (From Variant 4) */}
        <div className="header-top-bar">
          <span>📞 514-555-0123</span>
          <span>✉️ info@boomsold.ca</span>
        </div>

        {/* Main Header Content */}
        <div className="header-main">
          <div className="header-left">
            {/* Sidebar Trigger (From Variant 11) */}
            <div className="sidebar-trigger" onClick={toggleSidebar}>
              ☰
            </div>

            {/* Logo */}
            <div className="logo-container">
              <img src={logoUrl} alt="BoomSold" className="header-logo" />
            </div>
          </div>

          {/* Navigation (From Variant 4) */}
          <nav className="header-nav">
            <span className="nav-item">Buy</span>
            <span className="nav-item">Sell</span>
            <span className="nav-item">Map</span>
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
          <li>About</li>
          <li>Buy</li>
          <li>Sell</li>
          <li>Contact</li>
          <li>Legal</li>
        </ul>
      </div>
    </>
  );
};

export default Header;
