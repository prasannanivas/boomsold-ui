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
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Average Price:</span>
            <span className="detail-value price">
              {neighborhood.averagePrice}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Population:</span>
            <span className="detail-value">
              {neighborhood.population?.toLocaleString()}
            </span>
          </div>
          {neighborhood.lifeExpectancy && (
            <div className="detail-item">
              <span className="detail-label">Life Expectancy:</span>
              <span className="detail-value life-expectancy">
                {neighborhood.lifeExpectancy} years
              </span>
            </div>
          )}
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
