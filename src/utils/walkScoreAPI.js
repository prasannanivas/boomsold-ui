// Walk Score API Integration
// This utility fetches real walk scores from the Walk Score API
// Sign up at: https://www.walkscore.com/professional/api.php

const WALK_SCORE_API_KEY = process.env.REACT_APP_WALKSCORE_API_KEY;

/**
 * Fetch Walk Score for a specific address/location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} address - Street address (optional but recommended)
 * @returns {Promise<Object>} Walk Score data
 */
export const fetchWalkScore = async (lat, lng, address = "") => {
  if (!WALK_SCORE_API_KEY) {
    console.warn("Walk Score API key not configured");
    return null;
  }

  try {
    const url = `https://api.walkscore.com/score?format=json&lat=${lat}&lon=${lng}&address=${encodeURIComponent(
      address
    )}&wsapikey=${WALK_SCORE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 1) {
      return {
        walkScore: data.walkscore,
        transitScore: data.transit?.score || null,
        bikeScore: data.bike?.score || null,
        description: data.description,
        logo_url: data.logo_url,
        more_info_icon: data.more_info_icon,
        more_info_link: data.more_info_link,
        ws_link: data.ws_link,
      };
    } else {
      console.error("Walk Score API error:", data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching Walk Score:", error);
    return null;
  }
};

/**
 * Fetch Walk Score for multiple locations (batch processing)
 * @param {Array<Object>} locations - Array of {lat, lng, address, name}
 * @returns {Promise<Object>} Map of location names to scores
 */
export const fetchWalkScoresBatch = async (locations) => {
  const results = {};

  for (const location of locations) {
    try {
      const score = await fetchWalkScore(
        location.lat,
        location.lng,
        location.address || location.name
      );

      if (score) {
        results[location.name] = score;
      }

      // Rate limiting: Wait 200ms between requests (max 5 requests/second)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching score for ${location.name}:`, error);
    }
  }

  return results;
};

/**
 * Calculate approximate walkability based on POI density
 * This is a fallback when Walk Score API is not available
 * @param {Array} pois - Points of interest in the area
 * @param {Object} bounds - Geographic bounds {minLat, maxLat, minLng, maxLng}
 * @returns {Object} Calculated scores
 */
export const calculateWalkabilityScore = (pois, bounds) => {
  if (!pois || !Array.isArray(pois) || pois.length === 0) {
    return {
      walkScore: 50,
      transitScore: 50,
      bikeScore: 50,
      accessibilityScore: 50,
      description: "Moderate walkability (estimated)",
      calculated: true,
    };
  }

  // Calculate area in square kilometers (approximate)
  const latDiff = bounds.maxLat - bounds.minLat;
  const lngDiff = bounds.maxLng - bounds.minLng;
  const area = latDiff * lngDiff * 111 * 111; // Rough conversion to km²

  // Count different types of amenities
  const amenityCounts = {
    restaurants: 0,
    shops: 0,
    cafes: 0,
    schools: 0,
    parks: 0,
    transit: 0,
    healthcare: 0,
    entertainment: 0,
  };

  pois.forEach((poi) => {
    const tags = poi.tags || {};
    const amenity = tags.amenity;
    const shop = tags.shop;

    // Categorize POIs
    if (amenity === "restaurant" || amenity === "fast_food") {
      amenityCounts.restaurants++;
    }
    if (shop) {
      amenityCounts.shops++;
    }
    if (amenity === "cafe" || amenity === "bar") {
      amenityCounts.cafes++;
    }
    if (amenity === "school" || amenity === "university") {
      amenityCounts.schools++;
    }
    if (
      tags.leisure === "park" ||
      tags.leisure === "playground" ||
      amenity === "park"
    ) {
      amenityCounts.parks++;
    }
    if (
      amenity === "bus_station" ||
      tags.railway === "station" ||
      amenity === "subway_entrance"
    ) {
      amenityCounts.transit++;
    }
    if (
      amenity === "hospital" ||
      amenity === "clinic" ||
      amenity === "pharmacy"
    ) {
      amenityCounts.healthcare++;
    }
    if (amenity === "cinema" || amenity === "theatre" || tags.leisure) {
      amenityCounts.entertainment++;
    }
  });

  // Calculate density scores (POIs per km²)
  const totalPOIs = Object.values(amenityCounts).reduce((a, b) => a + b, 0);
  const poiDensity = area > 0 ? totalPOIs / area : 0;

  // Walk Score calculation (0-100)
  // Based on POI density and diversity
  let walkScore = Math.min(100, Math.floor(poiDensity * 2 + 30));

  // Boost score if there's good amenity diversity
  const diversity =
    Object.values(amenityCounts).filter((count) => count > 0).length / 8;
  walkScore = Math.min(100, Math.floor(walkScore * (0.7 + diversity * 0.3)));

  // Transit Score (based on transit stops)
  const transitDensity = area > 0 ? amenityCounts.transit / area : 0;
  let transitScore = Math.min(100, Math.floor(transitDensity * 50 + 40));

  // Bike Score (similar to walk score but slightly different weighting)
  let bikeScore = Math.min(100, Math.floor(walkScore * 0.9 + 10));

  // Accessibility Score (composite of all factors)
  const accessibilityScore = Math.floor(
    walkScore * 0.4 + transitScore * 0.35 + bikeScore * 0.25
  );

  // Description based on walk score
  let description;
  if (walkScore >= 90) {
    description = "Walker's Paradise - Daily errands do not require a car";
  } else if (walkScore >= 70) {
    description = "Very Walkable - Most errands can be accomplished on foot";
  } else if (walkScore >= 50) {
    description =
      "Somewhat Walkable - Some errands can be accomplished on foot";
  } else if (walkScore >= 25) {
    description = "Car-Dependent - Most errands require a car";
  } else {
    description = "Car-Dependent - Almost all errands require a car";
  }

  return {
    walkScore,
    transitScore,
    bikeScore,
    accessibilityScore,
    description,
    calculated: true,
    amenityCounts,
    poiCount: totalPOIs,
    area: area.toFixed(2),
  };
};

/**
 * Calculate walkability for all neighborhoods based on POIs
 * @param {Object} geoJsonData - GeoJSON with neighborhood features
 * @param {Array} allPois - All POIs in Montreal
 * @returns {Object} Map of neighborhood names to scores
 */
export const calculateAllNeighborhoodScores = (geoJsonData, allPois) => {
  const results = {};

  if (!geoJsonData || !geoJsonData.features) {
    return results;
  }

  geoJsonData.features.forEach((feature) => {
    const name =
      feature.properties.name || feature.properties.nom_arr || "Unknown";

    // Get neighborhood bounds
    const coords = [];
    if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((poly) => {
        poly.forEach((ring) => {
          coords.push(...ring);
        });
      });
    } else if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates.forEach((ring) => {
        coords.push(...ring);
      });
    }

    if (coords.length === 0) return;

    const lats = coords.map((c) => c[1]);
    const lngs = coords.map((c) => c[0]);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };

    // Filter POIs within neighborhood bounds
    const neighborhoodPois = allPois.filter((poi) => {
      const lat = poi.lat || (poi.center && poi.center.lat);
      const lon = poi.lon || (poi.center && poi.center.lon);

      if (!lat || !lon) return false;

      return (
        lat >= bounds.minLat &&
        lat <= bounds.maxLat &&
        lon >= bounds.minLng &&
        lon <= bounds.maxLng
      );
    });

    // Calculate scores
    const scores = calculateWalkabilityScore(neighborhoodPois, bounds);
    results[name] = scores;
  });

  return results;
};

const walkScoreAPI = {
  fetchWalkScore,
  fetchWalkScoresBatch,
  calculateWalkabilityScore,
  calculateAllNeighborhoodScores,
};

export default walkScoreAPI;
