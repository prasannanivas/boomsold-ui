import React from "react";
import "./NeighborhoodDetails.css";

const NeighborhoodDetails = ({ neighborhood }) => {
  if (!neighborhood) {
    return (
      <div className="neighborhood-details">
        <div className="details-placeholder">
          <h2>Montreal Neighborhoods</h2>
          <p>Hover over a neighborhood on the map to see its details</p>
          <div className="instructions">
            <ul>
              <li>🏠 Average property prices</li>
              <li>👥 Population statistics</li>
              <li>📍 Neighborhood description</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neighborhood-details">
      <div className="details-content">
        <h2 className="neighborhood-name">{neighborhood.name}</h2>
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
            {neighborhood.neighborhoodId && (
              <div className="detail-item">
                <span className="detail-label">Neighborhood ID:</span>
                <span className="detail-value">
                  {neighborhood.neighborhoodId}
                </span>
              </div>
            )}
            {neighborhood.boroughId && (
              <div className="detail-item">
                <span className="detail-label">Borough ID:</span>
                <span className="detail-value">{neighborhood.boroughId}</span>
              </div>
            )}
            {neighborhood.neighborhoodCode && (
              <div className="detail-item">
                <span className="detail-label">Code:</span>
                <span className="detail-value">
                  {neighborhood.neighborhoodCode}
                </span>
              </div>
            )}
          </div>

          {/* Real Estate Pricing */}
          <div className="section">
            <h4>🏠 Real Estate Pricing</h4>
            <div className="detail-item">
              <span className="detail-label">Average Price:</span>
              <span className="detail-value price">
                {neighborhood.averagePrice}
              </span>
            </div>
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

          {/* Raw Data Section (for debugging/complete info) */}
          {neighborhood.rawProperties && (
            <div className="section">
              <h4>🔍 Technical Data</h4>
              {Object.entries(neighborhood.rawProperties).map(
                ([key, value]) =>
                  value && (
                    <div key={key} className="detail-item">
                      <span className="detail-label">{key}:</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  )
              )}
            </div>
          )}

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
