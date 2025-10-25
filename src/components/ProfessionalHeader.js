import React from "react";

const ProfessionalHeader = () => {
  return (
    <div className="professional-header">
      <div className="header-content">
        <div className="brand-section">
          <img
            src={
              process.env.PUBLIC_URL +
              "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"
            }
            alt="Boomsold"
            className="brand-logo"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalHeader;
