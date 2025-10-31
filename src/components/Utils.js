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

// Function to determine color based on price range - Light Color Palette
export const getPriceColor = (price) => {
  if (!price) return "#E8D5E8"; // Default: Light Lavender
  const numPrice =
    typeof price === "string" ? parseInt(price.replace(/[",]/g, "")) : price;

  if (numPrice >= 2000000) return "#D4C5E2"; // Ultra-Luxury: Light Purple
  if (numPrice >= 1500000) return "#E0D5E8"; // Luxury: Light Lavender
  if (numPrice >= 1200000) return "#E8D4D4"; // High-End: Light Rose
  if (numPrice >= 1000000) return "#E8E0D4"; // Premium: Light Peach
  if (numPrice >= 800000) return "#D4E8E0"; // Upper-Mid: Light Mint
  if (numPrice >= 650000) return "#D4E8D4"; // Mid-Range: Light Green
  if (numPrice >= 500000) return "#D9E8F0"; // Moderate: Light Blue
  return "#E8E8E0"; // Affordable: Light Grey
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
  // Montreal Boroughs
  "Ahuntsic–Cartierville": "Ahuntsic-Cartierville",
  "Ahuntsic-Cartierville": "Ahuntsic-Cartierville",
  Anjou: "Anjou",
  "Côte-des-Neiges–Notre-Dame-de-Grâce": "Côte-des-Neiges–Notre-Dame-de-Grâce",
  "Côte-des-Neiges-Notre-Dame-de-Grâce": "Côte-des-Neiges–Notre-Dame-de-Grâce",
  "Le Plateau-Mont-Royal": "Le Plateau-Mont-Royal",
  "Le Sud-Ouest": "Le Sud-Ouest",
  "L'Île-Bizard–Sainte-Geneviève": "L'Île-Bizard–Sainte-Geneviève",
  "L'Île-Bizard - Sainte-Geneviève": "L'Île-Bizard–Sainte-Geneviève",
  "Mercier–Hochelaga-Maisonneuve": "Mercier–Hochelaga-Maisonneuve",
  "Mercier-Hochelaga-Maisonneuve": "Mercier–Hochelaga-Maisonneuve",
  "Montréal-Nord": "Montréal-Nord",
  Outremont: "Outremont",
  "Pierrefonds–Roxboro": "Pierrefonds–Roxboro",
  "Pierrefonds-Roxboro": "Pierrefonds–Roxboro",
  "Rivière-des-Prairies–Pointe-aux-Trembles":
    "Rivière-des-Prairies–Pointe-aux-Trembles",
  "Rivière-des-Prairies-Pointe-aux-Trembles":
    "Rivière-des-Prairies–Pointe-aux-Trembles",
  "Rosemont–La Petite-Patrie": "Rosemont–La Petite-Patrie",
  "Rosemont-La Petite-Patrie": "Rosemont–La Petite-Patrie",
  "Saint-Laurent": "Saint-Laurent",
  "Montréal (Saint-Laurent)": "Saint-Laurent",
  "Saint-Léonard": "Saint-Léonard",
  Verdun: "Verdun",
  "Ville-Marie": "Ville-Marie",
  "Villeray–Saint-Michel–Parc-Extension":
    "Villeray–Saint-Michel–Parc-Extension",
  "Villeray-Saint-Michel-Parc-Extension":
    "Villeray–Saint-Michel–Parc-Extension",
  Lachine: "Lachine",
  LaSalle: "LaSalle",

  // Independent Municipalities (West Island and others)
  "Baie-D'Urfé": "Baie-D'Urfé",
  Beaconsfield: "Beaconsfield",
  "Côte-Saint-Luc": "Côte-Saint-Luc",
  "Dollard-des-Ormeaux": "Dollard-des-Ormeaux",
  "Dollard-Des Ormeaux": "Dollard-des-Ormeaux",
  Dorval: "Dorval",
  Hampstead: "Hampstead",
  Kirkland: "Kirkland",
  "Montréal-Est": "Montréal-Est",
  "Mont-Royal": "Mont-Royal",
  "Montreal West": "Montreal West",
  "Montréal-Ouest": "Montreal West",
  "Pointe-Claire": "Pointe-Claire",
  "Sainte-Anne-de-Bellevue": "Sainte-Anne-de-Bellevue",
  Senneville: "Senneville",
  Westmount: "Westmount",
};
