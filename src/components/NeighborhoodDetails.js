import React from "react";
import "./NeighborhoodDetails.css";

const NeighborhoodDetails = ({ neighborhood, isPinned, onUnpin }) => {
  if (!neighborhood) {
    return (
      <div className="neighborhood-details">
        <div className="details-placeholder">
          <h2>Montreal Neighborhoods</h2>
          <p>Hover over a neighborhood to see details, click to pin it</p>
          <div className="instructions">
            <ul>
              <li>🏠 Average property prices</li>
              <li>👥 Population statistics</li>
              <li>� Click to pin details</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

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
        {neighborhood.neighborhood &&
          neighborhood.neighborhood !== neighborhood.name && (
            <h3 className="neighborhood-subtitle">
              🏘️ {neighborhood.neighborhood}
            </h3>
          )}

        <div className="details-grid">
          {/* Geographic Information */}
          <div className="section">
            <h4>📍 Geographic Information</h4>
            {neighborhood.municipality && (
              <div className="detail-item">
                <span className="detail-label">Municipality:</span>
                <span className="detail-value">
                  {neighborhood.municipality}
                </span>
              </div>
            )}
          </div>

          {/* Real Estate Pricing */}
          <div className="section">
            <h4>🏠 Real Estate Pricing</h4>

            {neighborhood.singleFamilyPrice && (
              <div className="detail-item">
                <span className="detail-label">Single Family Home:</span>
                <span className="detail-value price">
                  {neighborhood.singleFamilyPrice}
                </span>
              </div>
            )}
            {neighborhood.condoPrice && (
              <div className="detail-item">
                <span className="detail-label">Condo:</span>
                <span className="detail-value price">
                  {neighborhood.condoPrice}
                </span>
              </div>
            )}
            {neighborhood.pricePerSqft && (
              <div className="detail-item">
                <span className="detail-label">Price per Sq Ft:</span>
                <span className="detail-value">
                  {neighborhood.pricePerSqft}
                </span>
              </div>
            )}
            {neighborhood.marketTrend && (
              <div className="detail-item">
                <span className="detail-label">Market Trend:</span>
                <span className="detail-value trend">
                  {neighborhood.marketTrend}
                </span>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="section">
            <h4>📊 Housing Statistics</h4>
            {neighborhood.dwellingCount && (
              <div className="detail-item">
                <span className="detail-label">Number of Dwellings:</span>
                <span className="detail-value">
                  {neighborhood.dwellingCount.toLocaleString()}
                </span>
              </div>
            )}
            {neighborhood.listingCount && (
              <div className="detail-item">
                <span className="detail-label">Active Listings:</span>
                <span className="detail-value">
                  {neighborhood.listingCount}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="detail-item description">
            <span className="detail-label">About:</span>
            <p className="detail-description">{neighborhood.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodDetails;
