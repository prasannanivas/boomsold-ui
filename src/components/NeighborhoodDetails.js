import React from "react";
import "./NeighborhoodDetails.css";

const NeighborhoodDetails = ({ neighborhood, isPinned, onUnpin }) => {
  if (!neighborhood) {
    return <></>;
  }

  // Helper function to render amenity icons based on count
  const renderAmenityIcons = (count, icon) => {
    if (!count || count === 0) return null;

    // Show 1-3 icons based on count ranges
    let iconCount = 1;
    if (count >= 10) iconCount = 3;
    else if (count >= 5) iconCount = 2;

    return (
      <span style={{ display: "inline-flex", gap: "4px" }}>
        {[...Array(iconCount)].map((_, i) => (
          <span key={i}>{icon}</span>
        ))}
      </span>
    );
  };

  // Calculate approximate area (mock for now - you can add real area calculation)
  const calculateArea = () => {
    // Mock area calculation - replace with actual area from GeoJSON if available
    if (neighborhood.area) return neighborhood.area;
    return `${(Math.random() * 10 + 2).toFixed(1)} km²`;
  };

  return (
    <div className="neighborhood-details">
      <div className="details-content">
        <div className="details-header">
          <h2 className="neighborhood-name">{neighborhood.name}</h2>
          {isPinned && (
            <div className="pin-controls">
              <span className="pin-indicator">📌 Pinned</span>
              <button
                className="unpin-button"
                onClick={onUnpin}
                title="Unpin this neighborhood"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="details-grid">
          {/* Amenities Icons */}
          <div className="section amenities-section">
            <div className="amenities-icons">
              {(neighborhood.parkCount ||
                Math.floor(Math.random() * 15) + 1) && (
                <div className="amenity-item">
                  {renderAmenityIcons(
                    neighborhood.parkCount ||
                      Math.floor(Math.random() * 15) + 1,
                    "🌳"
                  )}
                </div>
              )}
              {(neighborhood.schoolCount ||
                Math.floor(Math.random() * 12) + 1) && (
                <div className="amenity-item">
                  {renderAmenityIcons(
                    neighborhood.schoolCount ||
                      Math.floor(Math.random() * 12) + 1,
                    "🏫"
                  )}
                </div>
              )}
              {(neighborhood.hospitalCount ||
                Math.floor(Math.random() * 8) + 1) && (
                <div className="amenity-item">
                  {renderAmenityIcons(
                    neighborhood.hospitalCount ||
                      Math.floor(Math.random() * 8) + 1,
                    "🏥"
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Real Estate Pricing */}
          <div className="section pricing-section">
            {neighborhood.singleFamilyPrice && (
              <div className="detail-item">
                <span className="detail-label">
                  Average Single Family Home Price
                </span>
                <span className="detail-value price">
                  {neighborhood.singleFamilyPrice}
                </span>
              </div>
            )}
            {neighborhood.condoPrice && (
              <div className="detail-item">
                <span className="detail-label">Average Condo Price</span>
                <span className="detail-value price">
                  {neighborhood.condoPrice}
                </span>
              </div>
            )}
          </div>

          {/* Area */}
          <div className="area-info">
            <span className="area-text">{calculateArea()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodDetails;
