import React from "react";
import { useTranslation } from "react-i18next";
import "./NeighborhoodDetails.css";

const NeighborhoodDetails = ({ neighborhood, isPinned, onUnpin }) => {
  const { t } = useTranslation();
  
  if (!neighborhood) {
    return <></>;
  }

  // Debug: Log the neighborhood object to see what we're receiving
  console.log("🏘️ NeighborhoodDetails received:", {
    name: neighborhood.name,
    parkCount: neighborhood.parkCount,
    schoolCount: neighborhood.schoolCount,
    hospitalCount: neighborhood.hospitalCount,
    restaurantCount: neighborhood.restaurantCount,
    sportsCount: neighborhood.sportsCount,
    metroCount: neighborhood.metroCount,
    trainsCount: neighborhood.trainsCount,
    remCount: neighborhood.remCount,
    daycaresCount: neighborhood.daycaresCount,
  });

  // Helper function to render emoji density based on count
  const renderAmenityDensity = (count, emoji) => {
    if (!count || count === 0) return null;

    // Show 1-3 emojis based on availability level
    let density = 1;
    if (count >= 10) density = 3;
    else if (count >= 5) density = 2;

    return (
      <span className="amenity-emoji-group">
        {[...Array(density)].map((_, i) => (
          <span key={i} className="amenity-emoji">
            {emoji}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="neighborhood-details">
      <div className="details-content">
        <div className="details-header">
          <h2 className="neighborhood-name">{neighborhood.name}</h2>
          {isPinned && (
            <div className="pin-controls">
              <span className="pin-indicator">{t('neighborhoodDetails.pinned')}</span>
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
          {/* Real Estate Pricing */}
          <div id="market-value-section" className="section pricing-section">
            {neighborhood.singleFamilyPrice && (
              <div className="detail-item">
                <span className="detail-label">
                  {t('neighborhoodDetails.singleFamilyPrice')}
                </span>
                <span className="detail-value price">
                  {neighborhood.singleFamilyPrice}
                </span>
              </div>
            )}
            {neighborhood.condoPrice && (
              <div className="detail-item">
                <span className="detail-label">{t('neighborhoodDetails.condoPrice')}</span>
                <span className="detail-value price">
                  {neighborhood.condoPrice}
                </span>
              </div>
            )}
          </div>

          {/* Amenities Section - Simple Emoji Indicators */}
          <div id="amenities-section" className="section amenities-section">
            <div className="amenities-compact">
              {renderAmenityDensity(neighborhood.parkCount, "🌳")}
              {renderAmenityDensity(neighborhood.schoolCount, "🏫")}
              {renderAmenityDensity(neighborhood.hospitalCount, "🏥")}
              {renderAmenityDensity(neighborhood.restaurantCount, "🍽️")}
              {renderAmenityDensity(neighborhood.sportsCount, "⚽")}
              {renderAmenityDensity(neighborhood.metroCount, "🚇")}
              {renderAmenityDensity(neighborhood.trainsCount, "🚆")}
              {renderAmenityDensity(neighborhood.remCount, "⚡")}
              {renderAmenityDensity(neighborhood.daycaresCount, "👶")}
            </div>
          </div>

          {/* Area */}
          <div className="area-info">
            <span className="area-text">{neighborhood.area}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodDetails;
