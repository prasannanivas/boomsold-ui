// src/components/Utils.js
// Utility functions extracted from MontrealMap.js

// Function to parse CSV price and return formatted price
export const parsePrice = (priceString) => {
  if (!priceString) return null;
  const cleanPrice = priceString.replace(/[",]/g, "");
  const price = parseInt(cleanPrice);
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 1000) {
    return `$${Math.round(price / 1000)}K`;
  }
  return `$${price}`;
};

// Function to determine color based on price range - Comic Book Style Palette (Yellow/Black Theme)
export const getPriceColor = (price) => {
  if (!price) return "#FFD54F"; // Default: Sunny Yellow
  const numPrice =
    typeof price === "string" ? parseInt(price.replace(/[",]/g, "")) : price;

  if (numPrice >= 2000000) return "#FFD700"; // Ultra-Luxury: Pure Gold (matching logo)
  if (numPrice >= 1500000) return "#FFEB3B"; // Luxury: Bright Yellow
  if (numPrice >= 1200000) return "#aa9c1eff"; // High-End: Light Yellow
  if (numPrice >= 1000000) return "#FFD54F"; // Premium: Sunny Yellow
  if (numPrice >= 800000) return "#317f85ff"; // Upper-Mid: Soft Green
  if (numPrice >= 650000) return "#66BB6A"; // Mid-Range: Fresh Green
  if (numPrice >= 500000) return "#4DB6AC"; // Moderate: Teal
  return "#4DD0E1"; // Affordable: Bright Cyan
};

// Function to rotate GeoJSON coordinates around a center point
export const rotateGeoJSON = (
  geoJsonData,
  angleDegrees,
  center,
  scaleX = 1.0,
  scaleY = 1.0
) => {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const rotateCoordinate = (coord) => {
    const [lng, lat] = coord;
    // Translate to origin
    const translatedLng = lng - center.lng;
    const translatedLat = lat - center.lat;
    // Rotate first
    const rotatedLng = translatedLng * cos - translatedLat * sin;
    const rotatedLat = translatedLng * sin + translatedLat * cos;
    // Apply scaling after rotation for uniform stretching
    const scaledLng = rotatedLng * scaleX;
    const scaledLat = rotatedLat * scaleY;
    // Translate back
    return [scaledLng + center.lng, scaledLat + center.lat];
  };

  const rotateCoordinates = (coords, depth = 0) => {
    if (depth === 0) {
      // For Polygon coordinates array
      return coords.map((ring) => ring.map(rotateCoordinate));
    } else if (depth === 1) {
      // For MultiPolygon coordinates array
      return coords.map((polygon) =>
        polygon.map((ring) => ring.map(rotateCoordinate))
      );
    }
  };

  return {
    ...geoJsonData,
    features: geoJsonData.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates:
          feature.geometry.type === "Polygon"
            ? rotateCoordinates(feature.geometry.coordinates, 0)
            : rotateCoordinates(feature.geometry.coordinates, 1),
      },
    })),
  };
};

// Generate initials function
export const generateInitials = (name) => {
  return name
    .split(/[\s-–]/)
    .map((part) => part.charAt(0))
    .join("")
    .substring(0, 3)
    .toUpperCase();
};

// Generate abbreviation from neighborhood name
export const generateAbbreviation = (name) => {
  if (!name) return "UNK";
  return name
    .split(/[\s-]/)
    .map((part) => part.charAt(0))
    .join("")
    .substring(0, 3)
    .toUpperCase();
};

export const nameMapping = {
  "Ahuntsic–Cartierville": "Ahuntsic-Cartierville",
  Anjou: "Anjou",
  "Baie-D'Urfé": "Baie-D'Urfé",
  Beaconsfield: "Beaconsfield",
  "Côte-des-Neiges–Notre-Dame-de-Grâce (NDG)":
    "Côte-des-Neiges–Notre-Dame-de-Grâce",
  "Côte-Saint-Luc": "Côte-Saint-Luc",
  "Dollard-des-Ormeaux": "Dollard-des-Ormeaux",
  Dorval: "Dorval",
  Hampstead: "Hampstead",
  Kirkland: "Kirkland",
  Lachine: "Lachine",
  LaSalle: "LaSalle",
  "Le Plateau-Mont-Royal": "Le Plateau-Mont-Royal",
  "Le Sud-Ouest": "Le Sud-Ouest",
  "L'Île-Bizard - Sainte-Geneviève": "L'Île-Bizard–Sainte-Geneviève",
  "Mercier–Hochelaga-Maisonneuve": "Mercier–Hochelaga-Maisonneuve",
  "Montréal-Est": "Montréal-Est",
  "Mont-Royal": "Mont-Royal",
  "Montréal-Nord": "Montréal-Nord",
  "Montreal West": "Montréal-Ouest",
  Outremont: "Outremont",
  "Pointe-Claire": "Pointe-Claire",
  "Pierrefonds–Roxboro": "Pierrefonds-Roxboro",
  "Rivière-des-Prairies–Pointe-aux-Trembles":
    "Rivière-des-Prairies–Pointe-aux-Trembles",
  "Rosemont–La Petite-Patrie": "Rosemont–La Petite-Patrie",
  "Montréal (Saint-Laurent)": "Saint-Laurent",
  "Saint-Léonard": "Saint-Léonard",
  "Sainte-Anne-de-Bellevue": "Sainte-Anne-de-Bellevue",
  Senneville: "Senneville",
  Verdun: "Verdun",
  "Ville-Marie": "Ville-Marie",
  "Villeray–Saint-Michel–Parc-Extension":
    "Villeray–Saint-Michel–Parc-Extension",
  Westmount: "Westmount",
};
