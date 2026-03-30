import React from "react";
import { useTranslation } from "react-i18next";
import "./MobileAreaSelection.css";

const MobileAreaSelection = ({ 
  selectedPart, 
  neighborhoods, 
  onNeighborhoodClick,
  onBack 
}) => {
  const { t } = useTranslation();
  return (
    <div className="mobile-area-selection">
      {/* Back Button */}
      {onBack && (
        <button className="mobile-back-button" onClick={onBack}>
          {t('mobile.back')}
        </button>
      )}

      <div className="mobile-area-content">
        <h2 className="mobile-area-title">
          {t('mobile.chooseArea')}
          <br />
          {t('mobile.in')} {selectedPart?.toUpperCase() || "MONTRÉAL"}
        </h2>

        <div className="mobile-area-buttons">
          {neighborhoods && neighborhoods.length > 0 ? (
            neighborhoods.map((neighborhood, index) => (
              <button
                key={neighborhood.properties?.name || index}
                className="mobile-area-button"
                onClick={() => onNeighborhoodClick(neighborhood)}
              >
                {neighborhood.properties?.name || `${t('mobile.area')} ${index + 1}`}
              </button>
            ))
          ) : (
            <>
              <button className="mobile-area-button">{t('mobile.area')} 1</button>
              <button className="mobile-area-button">{t('mobile.area')} 2</button>
              <button className="mobile-area-button">{t('mobile.area')} 3</button>
              <button className="mobile-area-button">{t('mobile.area')} 4</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileAreaSelection;
