import React from "react";
import "./MobileAreaSelection.css";

const MobileAreaSelection = ({ 
  selectedPart, 
  neighborhoods, 
  onNeighborhoodClick,
  onBack 
}) => {
  return (
    <div className="mobile-area-selection">
      {/* Back Button */}
      {onBack && (
        <button className="mobile-back-button" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="mobile-area-content">
        <h2 className="mobile-area-title">
          CHOOSE AN AREA
          <br />
          IN {selectedPart?.toUpperCase() || "MONTREAL"}
        </h2>

        <div className="mobile-area-buttons">
          {neighborhoods && neighborhoods.length > 0 ? (
            neighborhoods.map((neighborhood, index) => (
              <button
                key={neighborhood.properties?.name || index}
                className="mobile-area-button"
                onClick={() => onNeighborhoodClick(neighborhood)}
              >
                {neighborhood.properties?.name || `AREA ${index + 1}`}
              </button>
            ))
          ) : (
            // Fallback if no neighborhoods available
            <>
              <button className="mobile-area-button">AREA 1</button>
              <button className="mobile-area-button">AREA 2</button>
              <button className="mobile-area-button">AREA 3</button>
              <button className="mobile-area-button">AREA 4</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileAreaSelection;
