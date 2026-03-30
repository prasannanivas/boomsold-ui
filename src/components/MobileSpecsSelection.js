import React from "react";
import { useTranslation } from "react-i18next";
import "./MobileSpecsSelection.css";

const MobileSpecsSelection = ({ onSpecSelect, onBack }) => {
  const { t } = useTranslation();
  const specs = [
    { id: "market-value", label: t('mobile.propertyPrices') },
    { id: "amenities", label: t('mobile.amenities') },
    { id: "convinience", label: t('mobile.accessibility') },
    { id: "contact", label: t('mobile.contactMe') },
  ];

  return (
    <div className="mobile-specs-selection">
      {/* Back Button */}
      {onBack && (
        <button className="mobile-specs-back-button" onClick={onBack}>
          {t('mobile.back')}
        </button>
      )}

      <div className="mobile-specs-content">
        <h2 className="mobile-specs-title">
          {t('mobile.specsTitle')}
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
