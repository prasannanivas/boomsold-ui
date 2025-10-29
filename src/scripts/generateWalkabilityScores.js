// Script to generate and save walkability scores for all Montreal neighborhoods
// Run this script: node src/scripts/generateWalkabilityScores.js

const fs = require("fs");
const path = require("path");

// Load GeoJSON data
const geoJsonPath = path.join(
  __dirname,
  "../../public/quartierreferencehabitation_merged.geojson"
);
const poisPath = path.join(__dirname, "../../public/assets/montreal_pois.json");

// Montreal neighborhood coordinates (approximate centers)
const neighborhoodCenters = {
  "Ahuntsic-Cartierville": { lat: 45.5578, lng: -73.7041 },
  Anjou: { lat: 45.6139, lng: -73.5611 },
  "Baie-D'Urfé": { lat: 45.4167, lng: -73.9167 },
  Beaconsfield: { lat: 45.4333, lng: -73.8667 },
  "Côte-des-Neiges-Notre-Dame-de-Grâce": { lat: 45.4789, lng: -73.6239 },
  "Côte-Saint-Luc": { lat: 45.4667, lng: -73.6667 },
  "Dollard-Des Ormeaux": { lat: 45.4833, lng: -73.8 },
  Dorval: { lat: 45.45, lng: -73.75 },
  Hampstead: { lat: 45.4833, lng: -73.6333 },
  Kirkland: { lat: 45.45, lng: -73.8667 },
  Lachine: { lat: 45.4333, lng: -73.6667 },
  LaSalle: { lat: 45.4167, lng: -73.6333 },
  "Le Plateau-Mont-Royal": { lat: 45.5289, lng: -73.5764 },
  "Le Sud-Ouest": { lat: 45.4667, lng: -73.5833 },
  "L'Île-Bizard-Sainte-Geneviève": { lat: 45.5, lng: -73.9 },
  "Mercier-Hochelaga-Maisonneuve": { lat: 45.5889, lng: -73.5411 },
  "Montréal-Est": { lat: 45.6333, lng: -73.5 },
  "Mont-Royal": { lat: 45.5167, lng: -73.6333 },
  "Montréal-Nord": { lat: 45.6089, lng: -73.6289 },
  "Montreal West": { lat: 45.4667, lng: -73.65 },
  Outremont: { lat: 45.5189, lng: -73.6078 },
  "Pointe-Claire": { lat: 45.45, lng: -73.8167 },
  "Pierrefonds-Roxboro": { lat: 45.4833, lng: -73.85 },
  "Rivière-des-Prairies-Pointe-aux-Trembles": { lat: 45.6589, lng: -73.5439 },
  "Rosemont-La Petite-Patrie": { lat: 45.5489, lng: -73.5989 },
  "Saint-Laurent": { lat: 45.5167, lng: -73.6833 },
  "Montréal (Saint-Laurent)": { lat: 45.5167, lng: -73.6833 },
  "Saint-Léonard": { lat: 45.5889, lng: -73.5989 },
  "Sainte-Anne-de-Bellevue": { lat: 45.4, lng: -73.95 },
  Senneville: { lat: 45.4167, lng: -73.9333 },
  Verdun: { lat: 45.4578, lng: -73.5678 },
  "Ville-Marie": { lat: 45.5089, lng: -73.5617 },
  "Villeray-Saint-Michel-Parc-Extension": { lat: 45.5589, lng: -73.6189 },
  Westmount: { lat: 45.4833, lng: -73.6 },
};

// Point-in-polygon check
function isPointInPolygon(point, vs) {
  let x = point[1],
    y = point[0];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][1],
      yi = vs[i][0];
    let xj = vs[j][1],
      yj = vs[j][0];
    let intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate walkability score based on POI density
function calculateWalkabilityScore(pois, bounds) {
  if (!pois || pois.length === 0) {
    return {
      walkScore: 50,
      transitScore: 50,
      bikeScore: 50,
      accessibilityScore: 50,
      description: "Moderate walkability (estimated)",
    };
  }

  // Calculate area in square kilometers
  const latDiff = bounds.maxLat - bounds.minLat;
  const lngDiff = bounds.maxLng - bounds.minLng;
  const area = latDiff * lngDiff * 111 * 111;

  // Count amenities
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

    if (amenity === "restaurant" || amenity === "fast_food")
      amenityCounts.restaurants++;
    if (shop) amenityCounts.shops++;
    if (amenity === "cafe" || amenity === "bar") amenityCounts.cafes++;
    if (amenity === "school" || amenity === "university")
      amenityCounts.schools++;
    if (tags.leisure === "park" || amenity === "park") amenityCounts.parks++;
    if (amenity === "bus_station" || tags.railway === "station")
      amenityCounts.transit++;
    if (amenity === "hospital" || amenity === "clinic")
      amenityCounts.healthcare++;
    if (amenity === "cinema" || amenity === "theatre")
      amenityCounts.entertainment++;
  });

  const totalPOIs = Object.values(amenityCounts).reduce((a, b) => a + b, 0);
  const poiDensity = area > 0 ? totalPOIs / area : 0;

  let walkScore = Math.min(100, Math.floor(poiDensity * 2 + 30));
  const diversity =
    Object.values(amenityCounts).filter((c) => c > 0).length / 8;
  walkScore = Math.min(100, Math.floor(walkScore * (0.7 + diversity * 0.3)));

  const transitDensity = area > 0 ? amenityCounts.transit / area : 0;
  let transitScore = Math.min(100, Math.floor(transitDensity * 50 + 40));
  let bikeScore = Math.min(100, Math.floor(walkScore * 0.9 + 10));
  const accessibilityScore = Math.floor(
    walkScore * 0.4 + transitScore * 0.35 + bikeScore * 0.25
  );

  let description;
  if (walkScore >= 90)
    description = "Walker's Paradise - Daily errands do not require a car";
  else if (walkScore >= 70)
    description = "Very Walkable - Most errands can be accomplished on foot";
  else if (walkScore >= 50)
    description =
      "Somewhat Walkable - Some errands can be accomplished on foot";
  else if (walkScore >= 25)
    description = "Car-Dependent - Most errands require a car";
  else description = "Car-Dependent - Almost all errands require a car";

  return {
    walkScore,
    transitScore,
    bikeScore,
    accessibilityScore,
    description,
    amenityCounts,
  };
}

// Main function
async function generateScores() {
  console.log(
    "📊 Generating walkability scores for Montreal neighborhoods...\n"
  );

  try {
    // Load data
    const geoJsonData = JSON.parse(fs.readFileSync(geoJsonPath, "utf8"));
    const poisData = JSON.parse(fs.readFileSync(poisPath, "utf8"));
    const allPois = poisData.elements || [];

    console.log(`✅ Loaded ${geoJsonData.features.length} neighborhoods`);
    console.log(`✅ Loaded ${allPois.length} POIs\n`);

    const results = {};

    // Process each neighborhood
    geoJsonData.features.forEach((feature, index) => {
      const name =
        feature.properties.name || feature.properties.nom_arr || "Unknown";

      // Get bounds
      const coords = [];
      if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach((poly) => {
          poly.forEach((ring) => coords.push(...ring));
        });
      } else if (feature.geometry.type === "Polygon") {
        feature.geometry.coordinates.forEach((ring) => coords.push(...ring));
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

      // Filter POIs in neighborhood
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

      console.log(`${index + 1}. ${name}`);
      console.log(
        `   Walk Score: ${scores.walkScore} | Transit: ${scores.transitScore} | Bike: ${scores.bikeScore}`
      );
      console.log(
        `   POIs: ${neighborhoodPois.length} | ${scores.description}\n`
      );
    });

    // Save to file
    const outputPath = path.join(
      __dirname,
      "../data/neighborhoodWalkabilityScores.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n✅ Scores saved to: ${outputPath}`);
    console.log(
      `📊 Total neighborhoods processed: ${Object.keys(results).length}`
    );
  } catch (error) {
    console.error("❌ Error generating scores:", error);
  }
}

// Run the script
generateScores();
