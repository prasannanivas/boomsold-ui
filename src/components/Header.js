import React, { useState } from "react";
import "./Header.css";

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const logoUrl =
    process.env.PUBLIC_URL + "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png";

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isMobile = window.innerWidth <= 768;

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
