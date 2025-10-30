// Example component showing how to use the POI data
// This can be integrated into your MontrealMap component or used as a separate feature

import React, { useState } from "react";
import sportsData from "../../public/assets/montreal_sports.json";
import restaurantData from "../../public/assets/montreal_restaurants.json";

/**
 * POI Browser Component
 * Displays and filters Points of Interest (Sports & Restaurants)
 */
const POIBrowser = ({ selectedNeighborhood = null }) => {
  const [filter, setFilter] = useState("all"); // 'all', 'sports', 'restaurants'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPOI, setSelectedPOI] = useState(null);

  // Combine all POIs
  const allPOIs = [
    ...sportsData.elements.map((poi) => ({ ...poi, type: "sports" })),
    ...restaurantData.elements.map((poi) => ({ ...poi, type: "restaurant" })),
  ];

  // Filter POIs
  const filteredPOIs = allPOIs.filter((poi) => {
    // Filter by type
    if (filter !== "all" && poi.type !== filter) return false;

    // Filter by search term
    if (
      searchTerm &&
      !poi.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      // Also search in cuisine and sport
      if (
        poi.cuisine &&
        !poi.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        if (
          poi.sport &&
          !poi.sport.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
      }
    }

    return true;
  });

  // Get statistics
  const stats = {
    totalSports: sportsData.count,
    totalRestaurants: restaurantData.count,
    filtered: filteredPOIs.length,
    topCuisines: getTopCuisines(restaurantData.elements, 5),
    topSports: getTopSports(sportsData.elements, 5),
  };

  return (
    <div className="poi-browser">
      <div className="poi-header">
        <h2>Montreal Points of Interest</h2>
        <div className="poi-stats">
          <span>🏟️ {stats.totalSports} Sports</span>
          <span>🍽️ {stats.totalRestaurants} Restaurants</span>
        </div>
      </div>

      <div className="poi-controls">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, cuisine, or sport..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="poi-search"
        />

        {/* Filter buttons */}
        <div className="poi-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({allPOIs.length})
          </button>
          <button
            className={filter === "sports" ? "active" : ""}
            onClick={() => setFilter("sports")}
          >
            🏟️ Sports ({stats.totalSports})
          </button>
          <button
            className={filter === "restaurants" ? "active" : ""}
            onClick={() => setFilter("restaurants")}
          >
            🍽️ Restaurants ({stats.totalRestaurants})
          </button>
        </div>
      </div>

      <div className="poi-content">
        {/* Statistics Panel */}
        <div className="poi-stats-panel">
          <h3>Top Cuisines</h3>
          <ul>
            {stats.topCuisines.map(([cuisine, count], index) => (
              <li key={cuisine}>
                {index + 1}. {cuisine} ({count})
              </li>
            ))}
          </ul>

          <h3>Top Sports</h3>
          <ul>
            {stats.topSports.map(([sport, count], index) => (
              <li key={sport}>
                {index + 1}. {sport} ({count})
              </li>
            ))}
          </ul>
        </div>

        {/* POI List */}
        <div className="poi-list">
          <h3>
            {filter === "all"
              ? "All"
              : filter === "sports"
              ? "Sports"
              : "Restaurants"}{" "}
            ({filteredPOIs.length})
          </h3>
          <div className="poi-items">
            {filteredPOIs.slice(0, 100).map((poi) => (
              <div
                key={poi.id}
                className={`poi-item ${
                  selectedPOI?.id === poi.id ? "selected" : ""
                }`}
                onClick={() => setSelectedPOI(poi)}
              >
                <div className="poi-icon">
                  {poi.type === "sports" ? "🏟️" : "🍽️"}
                </div>
                <div className="poi-info">
                  <h4>{poi.name}</h4>
                  <p className="poi-category">{poi.category}</p>
                  {poi.cuisine && (
                    <p className="poi-detail">Cuisine: {poi.cuisine}</p>
                  )}
                  {poi.sport && (
                    <p className="poi-detail">Sport: {poi.sport}</p>
                  )}
                  {poi.address && <p className="poi-address">{poi.address}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedPOI && (
          <div className="poi-detail-panel">
            <button
              className="close-button"
              onClick={() => setSelectedPOI(null)}
            >
              ×
            </button>
            <h3>{selectedPOI.name}</h3>
            <p>
              <strong>Type:</strong> {selectedPOI.category}
            </p>
            {selectedPOI.cuisine && (
              <p>
                <strong>Cuisine:</strong> {selectedPOI.cuisine}
              </p>
            )}
            {selectedPOI.sport && (
              <p>
                <strong>Sport:</strong> {selectedPOI.sport}
              </p>
            )}
            {selectedPOI.address && (
              <p>
                <strong>Address:</strong> {selectedPOI.address}
              </p>
            )}
            {selectedPOI.phone && (
              <p>
                <strong>Phone:</strong> {selectedPOI.phone}
              </p>
            )}
            {selectedPOI.website && (
              <p>
                <strong>Website:</strong>{" "}
                <a
                  href={selectedPOI.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Website
                </a>
              </p>
            )}
            {selectedPOI.openingHours && (
              <p>
                <strong>Hours:</strong> {selectedPOI.openingHours}
              </p>
            )}
            <p>
              <strong>Coordinates:</strong> {selectedPOI.lat.toFixed(4)},{" "}
              {selectedPOI.lon.toFixed(4)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Helper function to get top cuisines
 */
function getTopCuisines(restaurants, limit = 10) {
  const cuisineCount = {};

  restaurants.forEach((restaurant) => {
    if (restaurant.cuisine) {
      const cuisines = restaurant.cuisine.split(";");
      cuisines.forEach((cuisine) => {
        const c = cuisine.trim();
        cuisineCount[c] = (cuisineCount[c] || 0) + 1;
      });
    }
  });

  return Object.entries(cuisineCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Helper function to get top sports
 */
function getTopSports(sports, limit = 10) {
  const sportCount = {};

  sports.forEach((facility) => {
    if (facility.sport) {
      const sportList = facility.sport.split(";");
      sportList.forEach((sport) => {
        const s = sport.trim();
        sportCount[s] = (sportCount[s] || 0) + 1;
      });
    }
  });

  return Object.entries(sportCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Helper function to check if a point is within neighborhood bounds
 */
export function filterPOIsByNeighborhood(pois, neighborhoodGeometry) {
  return pois.filter((poi) => {
    return isPointInPolygon(
      { lat: poi.lat, lon: poi.lon },
      neighborhoodGeometry
    );
  });
}

/**
 * Simple point-in-polygon check
 */
function isPointInPolygon(point, polygon) {
  // Implement ray casting algorithm
  // This is a simplified version - you may need a more robust implementation
  let inside = false;
  const coords = polygon.coordinates[0]; // Assuming simple polygon

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0],
      yi = coords[i][1];
    const xj = coords[j][0],
      yj = coords[j][1];

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Export utility functions
 */
export const POIUtils = {
  getTopCuisines,
  getTopSports,
  filterPOIsByNeighborhood,
  isPointInPolygon,
};

export default POIBrowser;
