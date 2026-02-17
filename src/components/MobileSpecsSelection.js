import React from "react";
import "./MobileSpecsSelection.css";

const MobileSpecsSelection = ({ onSpecSelect, onBack }) => {
  const specs = [
    { id: "market-value", label: "MARKET VALUE" },
    { id: "amenities", label: "AMENITIES" },
    { id: "convinience", label: "CONVINIENCE" },
    { id: "contact", label: "CONTACT ME" },
  ];

  return (
    <div className="mobile-specs-selection">
      {/* Back Button */}
      {onBack && (
        <button className="mobile-specs-back-button" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="mobile-specs-content">
        <h2 className="mobile-specs-title">
          SPECS IN THIS AREA
        </h2>

        <div className="mobile-specs-buttons">
          {specs.map((spec) => (
            <button
              key={spec.id}
              className="mobile-spec-button"
              onClick={() => onSpecSelect(spec.id)}
            >
              {spec.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileSpecsSelection;
