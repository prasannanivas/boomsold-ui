import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { MapContainer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import simplify from "simplify-js";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import "./PremiumEffects.css";
import {
  parsePrice,
  getPriceColor,
  rotateGeoJSON,
  generateInitials,
  generateAbbreviation,
  nameMapping,
} from "./Utils";
import MontrealSvg from "./MontrealSvg";

import MaskedOutside from "./MaskedOutside.js";

// Iconic Montreal locations with coordinates and logos
const ICONIC_LOCATIONS = [
  {
    id: "airport",
    name: "Montreal-Trudeau Airport",
    coordinates: [45.4687293, -73.742497],
    icon: "✈️",
    description: "Montreal-Trudeau International Airport",
    color: "#4A90E2",
  },
  {
    id: "oratory",
    name: "Saint Joseph's Oratory",
    coordinates: [45.4920517, -73.6166992],
    icon: "⛪",
    description: "Saint Joseph's Oratory",
    color: "#8B4513",
  },
  {
    id: "bell-centre",
    name: "Bell Centre",
    coordinates: [45.4960358, -73.5692029],
    icon: "image", // Special marker to use image
    imageSrc: require("../data/Montreal_Canadiens.svg.png"),
    description: "Bell Centre - Montreal Canadiens",
    color: "#AF1E2D",
  },
  {
    id: "old-port",
    name: "Old Port",
    coordinates: [45.5042344, -73.5529866],
    icon: "🎡",
    description: "Old Port - Ferris Wheel",
    color: "#FF6B6B",
  },
];

// Create custom icon for iconic locations
const createIconicLocationIcon = (location) => {
  // Check if this location uses an image instead of emoji
  if (location.icon === "image" && location.imageSrc) {
    return L.divIcon({
      className: "iconic-location-icon",
      html: `
        <div style="
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        ">
          <img 
            src="${location.imageSrc}" 
            alt="${location.name}"
            style="
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
              border: 0;
              border-radius: 50%;
            "
          />
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }

  // Default emoji icon
  return L.divIcon({
    className: "iconic-location-icon",
    html: `
      <div style="
        font-size: 24px;
        line-height: 1;
        text-align: center;
        pointer-events: none;
      ">
        ${location.icon}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Apply rotation to iconic locations coordinates
const rotateIconicLocations = (
  locations,
  rotationAngle,
  centerPoint,
  scaleX = 1,
  scaleY = 1
) => {
  return locations.map((location) => {
    const [lat, lng] = location.coordinates;

    // Convert to radians
    const angleRad = (rotationAngle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Translate to origin
    const translatedLat = lat - centerPoint.lat;
    const translatedLng = lng - centerPoint.lng;

    // Rotate first (same as GeoJSON rotation logic)
    const rotatedLng = translatedLng * cos - translatedLat * sin;
    const rotatedLat = translatedLng * sin + translatedLat * cos;

    // Apply scaling after rotation
    const scaledLng = rotatedLng * scaleX;
    const scaledLat = rotatedLat * scaleY;

    // Translate back
    const finalLat = scaledLat + centerPoint.lat;
    const finalLng = scaledLng + centerPoint.lng;

    return {
      ...location,
      coordinates: [finalLat, finalLng],
    };
  });
};

// Component to update map zoom dynamically
const ZoomUpdater = ({ zoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    if (map && zoomLevel) {
      map.setZoom(zoomLevel);
    }
  }, [map, zoomLevel]);

  return null;
};

// Simple point-in-polygon algorithm for [lat, lng] arrays
function isPointInPolygon(point, vs) {
  // point: [lat, lng], vs: array of [lat, lng]
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

// Calculate geographic area from GeoJSON coordinates using Shoelace formula
function calculatePolygonArea(coordinates) {
  // coordinates is an array of [lng, lat] pairs
  if (!coordinates || coordinates.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area) / 2;

  // Convert to approximate km² (rough approximation for Montreal lat/lng)
  // At Montreal's latitude (~45°), 1 degree ≈ 78.8 km (longitude) and 111.2 km (latitude)
  const kmPerDegreeLat = 111.2;
  const kmPerDegreeLng = 78.8;
  area = area * kmPerDegreeLat * kmPerDegreeLng;

  return area;
}

// Calculate total area for a feature (handles Polygon and MultiPolygon)
function calculateFeatureArea(geometry) {
  if (!geometry || !geometry.coordinates) return 0;

  let totalArea = 0;

  if (geometry.type === "Polygon") {
    // For Polygon, use the outer ring (first array)
    totalArea = calculatePolygonArea(geometry.coordinates[0]);
  } else if (geometry.type === "MultiPolygon") {
    // For MultiPolygon, sum all polygon areas
    geometry.coordinates.forEach((polygon) => {
      totalArea += calculatePolygonArea(polygon[0]);
    });
  }

  return totalArea;
}

// Professional Header Component

// Function to get color based on neighborhood part (direction)
const getColorByPart = (part) => {
  const colorMap = {
    North: "#FF6B6B", // Red
    South: "#4ECDC4", // Teal
    East: "#FFE66D", // Yellow
    West: "#95E1D3", // Mint Green
  };
  return colorMap[part] || "#4DD0E1"; // Default teal if no part specified
};

// Neighborhood name abbreviations mapping
const neighborhoodAbbreviations = {
  "Ahuntsic–Cartierville": "Ahuntsic",
  "Ahuntsic-Cartierville": "Ahuntsic",
  Anjou: "Anjou",
  "Baie-D'Urfé": "Baie-D'Urfé",
  Beaconsfield: "Beaconsfield",
  "Côte-des-Neiges–Notre-Dame-de-Grâce": "CDN/NDG",
  "Côte-des-Neiges-Notre-Dame-de-Grâce": "CDN/NDG",
  "Côte-Saint-Luc": "CSL",
  "Dollard-des-Ormeaux": "DDO",
  "Dollard-Des Ormeaux": "DDO",
  Dorval: "Dorval",
  Hampstead: "Hampstead",
  Kirkland: "Kirkland",
  Lachine: "Lachine",
  LaSalle: "Lasalle",
  "Le Plateau-Mont-Royal": "Plateau",
  "Le Sud-Ouest": "Le Sud-Ouest",
  "L'Île-Bizard–Sainte-Geneviève": "Île-Bizard",
  "L'Île-Bizard - Sainte-Geneviève": "Île-Bizard",
  "Mercier–Hochelaga-Maisonneuve": "Hochelaga",
  "Mercier-Hochelaga-Maisonneuve": "Hochelaga",
  "Montréal-Est": "Mtl-Est",
  "Mont-Royal": "Mont-Royal",
  "Montréal-Nord": "Mtl-Nord",
  "Montreal West": "Mtl West",
  Outremont: "Outremont",
  "Pointe-Claire": "Pointe-Claire",
  "Pierrefonds–Roxboro": "Pierrefonds",
  "Pierrefonds-Roxboro": "Pierrefonds",
  "Rivière-des-Prairies–Pointe-aux-Trembles": "RDP",
  "Rivière-des-Prairies-Pointe-aux-Trembles": "RDP",
  "Rosemont–La Petite-Patrie": "Rosemont",
  "Rosemont-La Petite-Patrie": "Rosemont",
  "Montréal (Saint-Laurent)": "St-Laurent",
  "Saint-Laurent": "St-Laurent",
  "Saint-Léonard": "St-Léonard",
  "Sainte-Anne-de-Bellevue": "Ste-Anne",
  "Ste-Anne": "Ste-Anne",
  Senneville: "Senneville",
  "Montréal-Ouest": "Mtl-Ouest",
  Verdun: "Verdun",
  "Ville-Marie": "Ville-Marie",
  "Villeray–Saint-Michel–Parc-Extension": "Villeray-St-Michel-Park X",
  "Villeray-Saint-Michel-Parc-Extension": "Villeray-St-Michel-Park X",
  Westmount: "Westmount",
};

// Function to get abbreviated name
const getAbbreviatedName = (fullName) => {
  if (!fullName) return fullName;
  return neighborhoodAbbreviations[fullName] || fullName;
};

// Import the real Montreal data
const MontrealMap = ({
  onNeighborhoodHover,
  onNeighborhoodLeave,
  onNeighborhoodClick,
  startNeighborhoodAnimation = false,
  isPinned = false,
  pinnedNeighborhood = null,
  selectedPart = null, // NEW: Name of selected part (for config)
  partGeoJSON = null, // NEW: Pre-filtered and rotated GeoJSON for selected part
  onPartBack = null, // NEW: Callback to go back to PartMap
}) => {
  const { t } = useTranslation();
  // Rotated (default) and Top-View (unrotated) datasets
  const [montrealData, setMontrealData] = useState(null); // rotated
  const [montrealDataTop, setMontrealDataTop] = useState(null); // unrotated (top view)

  const [currentZoom, setCurrentZoom] = useState(10);
  const [zoomLevel, setZoomLevel] = useState(10.8); // Dynamic zoom level based on dimensions
  // Removed unused satellite/top-view toggles
  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Detect mobile device

  // Removed unused POI markers state

  const [shouldAnimateNeighborhoods, setShouldAnimateNeighborhoods] =
    useState(false);

  // Local PIN state (name of pinned neighborhood). Independent of parent props for now.
  const [localPinnedName, setLocalPinnedName] = useState(null);

  // Right-side panel state
  // Removed unused right-side panel state

  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [filters, setFilters] = useState({
    showBoroughs: true,
    showSuburbs: true,
    minArea: 0,
    accessibility: {
      parks: false,
      schools: false,
      hospitals: false,
    },
  });

  const pinnedRef = useRef(null);
  useEffect(() => {
    pinnedRef.current = pinnedNeighborhood;
  }, [pinnedNeighborhood]);

  // Calculate optimal zoom level based on window dimensions with 0.1 granularity
  const calculateZoomLevel = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Base zoom calculation - larger screens get more zoom
    // Width has 2x weight, height has 1x weight (width is more important for horizontal map)
    const weightedScore = width * 2 + height * 1;
    let zoom;

    if (weightedScore < 2400) {
      zoom = 10.0; // Very small screens
    } else if (weightedScore < 2600) {
      zoom = 10.1;
    } else if (weightedScore < 2800) {
      zoom = 10.2;
    } else if (weightedScore < 3000) {
      zoom = 10.3;
    } else if (weightedScore < 3200) {
      zoom = 10.4;
    } else if (weightedScore < 3400) {
      zoom = 10.5;
    } else if (weightedScore < 3600) {
      zoom = 10.6;
    } else if (weightedScore < 3800) {
      zoom = 10.7;
    } else if (weightedScore < 4000) {
      zoom = 10.8;
    } else if (weightedScore < 4200) {
      zoom = 10.9;
    } else if (weightedScore < 4400) {
      zoom = 11.0;
    } else if (weightedScore < 4600) {
      zoom = 11.1;
    } else if (weightedScore < 4800) {
      zoom = 11.2;
    } else if (weightedScore < 5000) {
      zoom = 11.3;
    } else if (weightedScore < 5200) {
      zoom = 11.4;
    } else if (weightedScore < 5400) {
      zoom = 11.5;
    } else if (weightedScore < 5600) {
      zoom = 11.6;
    } else if (weightedScore < 5800) {
      zoom = 11.7;
    } else if (weightedScore < 6000) {
      zoom = 11.8;
    } else if (weightedScore < 6200) {
      zoom = 11.9;
    } else {
      zoom = 12.0; // Very large screens
    }

    console.log(
      `Calculated zoom level: ${zoom} for weighted score: ${weightedScore} (width: ${width}, height: ${height})`
    );

    return zoom + 0.9;
  }, []);

  // Handle window resize for mobile detection and zoom calculation
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setZoomLevel(calculateZoomLevel());
    };

    // Initial calculation
    setZoomLevel(calculateZoomLevel());

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateZoomLevel]);

  // Handle window resize for mobile detection (REMOVED - merged with above)
  // useEffect(() => {
  //   const handleResize = () => {
  //     setIsMobile(window.innerWidth <= 768);
  //   };
  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  // Removed unused marker loading state

  const [allPois, setAllPois] = useState([]);
  const [allMetro, setAllMetro] = useState([]);
  const [allTrains, setAllTrains] = useState([]);
  const [allRem, setAllRem] = useState([]);
  const [allDaycares, setAllDaycares] = useState([]);
  const [iconicLocations, setIconicLocations] = useState([]); // Store rotated iconic locations

  const geoJsonLayerRef = useRef(null);
  const animationAttemptsRef = useRef(0);
  const lastFocusedPartRef = useRef(null);

  const focusMapOnFeatures = useCallback(
    (features, partName = null) => {
      if (!map || !features || !features.length) {
        return;
      }

      const latLngs = [];

      features.forEach((feature) => {
        const geometry = feature?.geometry;
        if (!geometry || !geometry.coordinates) {
          return;
        }

        const pushCoords = (coords) => {
          coords.forEach(([lng, lat]) => {
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              latLngs.push([lat, lng]);
            }
          });
        };

        if (geometry.type === "Polygon") {
          geometry.coordinates.forEach(pushCoords);
        } else if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach((polygon) =>
            polygon.forEach(pushCoords)
          );
        }
      });

      if (!latLngs.length) {
        return;
      }

      const bounds = L.latLngBounds(latLngs);

      // Get part-specific zoom level
      const partZoomLevels = {
        North: 11.5,
        Central: 12.5,
        South: 12,
        East: 12.5,
        West: 12,
      };

      const targetZoom =
        partName && partZoomLevels[partName] ? partZoomLevels[partName] : 12;

      const boundsOptions = {
        padding: [100, 100],
        maxZoom: targetZoom,
        duration: 0.6,
      };

      if (typeof map.flyToBounds === "function") {
        map.flyToBounds(bounds, boundsOptions);
      } else {
        map.fitBounds(bounds, boundsOptions);
      }
    },
    [map]
  );

  const getFeatureLayers = useCallback(() => {
    const layerGroup = geoJsonLayerRef.current;
    if (!layerGroup) {
      return [];
    }
    const collectedLayers = [];
    layerGroup.eachLayer((layer) => {
      if (layer?.feature) {
        collectedLayers.push(layer);
      }
    });
    return collectedLayers;
  }, []);

  const applyInitialHiddenState = useCallback(
    (layersOverride) => {
      const layers = layersOverride ?? getFeatureLayers();
      let hiddenCount = 0;
      layers.forEach((layer) => {
        const pathElement = layer?.getElement();
        if (!pathElement) {
          return;
        }

        const duration = 0.85 + Math.random() * 0.5;
        const startOffset = -160 - Math.random() * 160;
        const rotation = (Math.random() * 18 - 9).toFixed(2);
        const swing = (-rotation / 3).toFixed(2);

        pathElement.classList.remove("neighborhood-falling");
        void pathElement.offsetWidth; // Reset animation state
        pathElement.style.setProperty(
          "--fall-duration",
          `${duration.toFixed(2)}s`
        );
        pathElement.style.setProperty("--fall-start-y", `${startOffset}px`);
        pathElement.style.setProperty("--fall-rotation", `${rotation}deg`);
        pathElement.style.setProperty("--fall-swing", `${swing}deg`);
        pathElement.classList.add("neighborhood-hidden");
        hiddenCount += 1;
      });

      return hiddenCount;
    },
    [getFeatureLayers]
  );

  // Removed unused splitAmenityMarkers helper

  // Neighborhood animations
  const triggerNeighborhoodAnimations = useCallback(() => {
    if (!montrealData) {
      console.log("❌ Cannot animate: missing map or data");
      return;
    }

    console.log("🎬 Starting neighborhood falling animations!");

    const layers = getFeatureLayers();

    if (!layers.length) {
      if (animationAttemptsRef.current < 5) {
        animationAttemptsRef.current += 1;
        console.log(
          `⏱️ No layers yet, retrying animation (attempt ${animationAttemptsRef.current})`
        );
        setTimeout(() => {
          triggerNeighborhoodAnimations();
        }, 300);
      } else {
        console.log(
          "⚠️ Unable to find neighborhood layers after multiple attempts"
        );
      }
      return;
    }

    animationAttemptsRef.current = 0;

    const hiddenCount = applyInitialHiddenState(layers);
    console.log(`🫥 Prepared ${hiddenCount} neighborhoods for animation`);

    const shuffledLayers = [...layers].sort(() => Math.random() - 0.5);

    setTimeout(() => {
      shuffledLayers.forEach((layer, index) => {
        const delay = index * 0.075 + Math.random() * 0.18;

        const startAnimation = (attempt = 0) => {
          const pathElement = layer?.getElement();
          if (!pathElement) {
            if (attempt < 5) {
              requestAnimationFrame(() => startAnimation(attempt + 1));
            }
            return;
          }

          pathElement.classList.remove("neighborhood-falling");
          void pathElement.offsetWidth; // Restart animation
          pathElement.style.setProperty("--fall-delay", `${delay.toFixed(2)}s`);

          requestAnimationFrame(() => {
            pathElement.classList.remove("neighborhood-hidden");
            pathElement.classList.add("neighborhood-falling");
          });
        };

        startAnimation();
      });
      console.log(`📊 Animating ${shuffledLayers.length} neighborhoods`);
    }, 160);
  }, [montrealData, applyInitialHiddenState, getFeatureLayers]);

  // Load both GeoJSON, JSON price data, and POIs
  useEffect(() => {
    // If partGeoJSON is provided, use it directly instead of loading and filtering
    if (partGeoJSON) {
      Promise.all([
        Promise.resolve(partGeoJSON), // Use the pre-filtered and rotated GeoJSON
        fetch(process.env.PUBLIC_URL + "/neighborhood-prices.json").then(
          (response) => response.json()
        ),
        fetch(process.env.PUBLIC_URL + "/assets/montreal_pois.json").then(
          (response) => response.json()
        ),
        fetch(process.env.PUBLIC_URL + "/assets/montreal_metro.json").then(
          (response) => response.json()
        ),
        fetch(process.env.PUBLIC_URL + "/assets/montreal_trains.json").then(
          (response) => response.json()
        ),
        fetch(process.env.PUBLIC_URL + "/assets/montreal_rem.json").then(
          (response) => response.json()
        ),
        fetch(process.env.PUBLIC_URL + "/assets/montreal_daycares.json").then(
          (response) => response.json()
        ),
        fetch(
          process.env.PUBLIC_URL + "/quartierreferencehabitation_merged.geojson"
        ).then((response) => response.json()),
      ])
        .then(
          ([
            geoJsonData,
            priceData,
            poisData,
            metroData,
            trainsData,
            remData,
            daycaresData,
            unrotatedGeoJsonData,
          ]) => {
            // Create neighborhood mapping from JSON data
            const neighborhoodMapping = {};

            // Process JSON data and create mapping
            priceData.neighborhoods.forEach((neighborhood) => {
              const geoJsonName =
                nameMapping[neighborhood.name] || neighborhood.name;

              console.log("🗺️ NAME MAPPING:", {
                originalName: neighborhood.name,
                mappedName: geoJsonName,
                hasMappingRule: !!nameMapping[neighborhood.name],
                singleFamilyPrice: neighborhood.singleFamilyPrice,
                condoPrice: neighborhood.condoPrice,
              });

              const singleFamilyPrice = neighborhood.singleFamilyPrice;
              const condoPrice = neighborhood.condoPrice;

              if (geoJsonName && singleFamilyPrice) {
                const rawSingleFamily = singleFamilyPrice.replace(/[$,]/g, "");
                const rawCondo = condoPrice
                  ? condoPrice.replace(/[$,]/g, "")
                  : null;
                const color = getPriceColor(rawSingleFamily);

                neighborhoodMapping[geoJsonName] = {
                  initials: generateInitials(geoJsonName),
                  color: color,
                  price: singleFamilyPrice,
                  singleFamilyPrice: singleFamilyPrice,
                  condoPrice: condoPrice,
                  rawSingleFamily: rawSingleFamily,
                  rawCondo: rawCondo,
                };
              }
            });

            // Add some missing neighborhoods with default values
            const additionalNeighborhoods = {
              "L'Île-Dorval": {
                initials: "ID",
                color: "#F7D794",
                price: "$1.5M",
              },
            };

            Object.assign(neighborhoodMapping, additionalNeighborhoods);

            // Enrich features with data
            geoJsonData.features.forEach((feature) => {
              const boroughName = feature.properties.nom_arr;
              const neighborhoodName = feature.properties.nom_qr;
              const municipalityName = feature.properties.nom_mun;
              const partDirection = feature.properties.part; // Get the part (East, West, South, North)

              // Determine scope: Borough (part of Montreal) or Suburb (independent municipality)
              const scope = boroughName ? "Borough" : "Suburb";

              // Try to match by borough first, then by municipality/neighborhood for independent cities
              const lookupName =
                boroughName || municipalityName || neighborhoodName;

              // Apply name mapping to handle variations
              const mappedLookupName = nameMapping[lookupName] || lookupName;
              const areaData = neighborhoodMapping[mappedLookupName];

              console.log("🔍 FEATURE LOOKUP:", {
                boroughName,
                municipalityName,
                neighborhoodName,
                lookupName,
                mappedLookupName,
                foundData: !!areaData,
                scope,
              });

              // Calculate geographic area from geometry
              const areaInKm2 = calculateFeatureArea(feature.geometry);
              feature.properties.area = `${areaInKm2.toFixed(1)} km²`;
              feature.properties.scope = scope; // Add scope property

              if (areaData) {
                feature.properties.color = areaData.color;
                feature.properties.value = areaData.initials;
                feature.properties.avgPrice = areaData.price;
                feature.properties.singleFamilyPrice =
                  areaData.singleFamilyPrice;
                feature.properties.condoPrice = areaData.condoPrice;
                feature.properties.listingCount =
                  Math.floor(Math.random() * 150) + 50;
                feature.properties.priceChange = (
                  Math.random() * 15 +
                  5
                ).toFixed(1);
                feature.properties.pricePerSqft =
                  Math.floor(Math.random() * 200) + 300; // Store as consistent value
                feature.properties.name = lookupName; // Use lookupName instead of boroughName
                feature.properties.neighborhood = neighborhoodName;
                feature.properties.rawSingleFamily = areaData.rawSingleFamily;
                feature.properties.rawCondo = areaData.rawCondo;
              } else {
                const isSuburb = !boroughName || boroughName !== "Montréal";
                // Use part-based color if available, otherwise use default
                const colorBasedOnPart = getColorByPart(partDirection);
                const defaultColor = isSuburb ? "#80CBC4" : colorBasedOnPart;
                const defaultPrice = isSuburb ? "$550K" : "$520K";

                feature.properties.color = defaultColor;
                feature.properties.value = generateAbbreviation(
                  neighborhoodName || boroughName
                );
                feature.properties.avgPrice = defaultPrice;
                feature.properties.listingCount =
                  Math.floor(Math.random() * 100) + 30;
                feature.properties.priceChange = (
                  Math.random() * 15 +
                  5
                ).toFixed(1);
                feature.properties.pricePerSqft =
                  Math.floor(Math.random() * 200) + 300; // Store as consistent value
                feature.properties.name =
                  boroughName || neighborhoodName || "Unknown Area";
                feature.properties.neighborhood =
                  neighborhoodName || "Unknown Neighborhood";
                feature.properties.rawSingleFamily = null;
                feature.properties.rawCondo = null;
              }

              feature.properties.type = "neighborhood";
              feature.properties.municipality =
                feature.properties.nom_mun || "Montréal";
            });

            // Unified appearance metadata
            const processedData = {
              ...geoJsonData,
              features: geoJsonData.features.map((feature) => {
                if (feature.properties.merged_from > 1) {
                  return {
                    ...feature,
                    properties: {
                      ...feature.properties,
                      isMerged: true,
                      className: "merged-borough",
                    },
                  };
                }
                return {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    className: "single-borough",
                  },
                };
              }),
            };

            // The data is already rotated from PartMap, use it directly
            setMontrealData(processedData);

            // Use unrotated data for top view (and POI calculations)
            // Filter unrotated data to match the selected part if needed
            let unrotatedFiltered = unrotatedGeoJsonData;
            if (selectedPart) {
              unrotatedFiltered = {
                ...unrotatedGeoJsonData,
                features: unrotatedGeoJsonData.features.filter(
                  (f) => f.properties.part === selectedPart
                ),
              };
            }
            setMontrealDataTop(unrotatedFiltered);

            // Rotate iconic locations with the same parameters used in PartMap
            const centerPoint = { lat: 45.48, lng: -73.62 };
            const rotatedIconicLocations = rotateIconicLocations(
              ICONIC_LOCATIONS,
              335,
              centerPoint,
              1.2,
              1
            );
            setIconicLocations(rotatedIconicLocations);

            setAllPois(poisData.elements);
            setAllMetro(metroData);
            setAllTrains(trainsData);
            setAllRem(remData);
            setAllDaycares(daycaresData);
            setIsMapLoaded(true);
          }
        )
        .catch((error) => console.error("Error loading Montreal data:", error));
      return; // Exit early when using partGeoJSON
    }

    // Original logic: Load full data when no partGeoJSON is provided
    Promise.all([
      fetch(
        process.env.PUBLIC_URL + "/quartierreferencehabitation_merged.geojson"
      ).then((response) => response.json()),
      fetch(process.env.PUBLIC_URL + "/neighborhood-prices.json").then(
        (response) => response.json()
      ),
      fetch(process.env.PUBLIC_URL + "/assets/montreal_pois.json").then(
        (response) => response.json()
      ),
      fetch(process.env.PUBLIC_URL + "/assets/montreal_metro.json").then(
        (response) => response.json()
      ),
      fetch(process.env.PUBLIC_URL + "/assets/montreal_trains.json").then(
        (response) => response.json()
      ),
      fetch(process.env.PUBLIC_URL + "/assets/montreal_rem.json").then(
        (response) => response.json()
      ),
      fetch(process.env.PUBLIC_URL + "/assets/montreal_daycares.json").then(
        (response) => response.json()
      ),
    ])
      .then(
        ([
          geoJsonData,
          priceData,
          poisData,
          metroData,
          trainsData,
          remData,
          daycaresData,
        ]) => {
          // Filter by selected part if provided
          let filteredGeoJsonData = geoJsonData;
          if (selectedPart) {
            filteredGeoJsonData = {
              ...geoJsonData,
              features: geoJsonData.features.filter(
                (feature) => feature.properties.part === selectedPart
              ),
            };
          }

          // Create neighborhood mapping from JSON data
          const neighborhoodMapping = {};

          // Process JSON data and create mapping
          priceData.neighborhoods.forEach((neighborhood) => {
            const geoJsonName =
              nameMapping[neighborhood.name] || neighborhood.name;
            const singleFamilyPrice = neighborhood.singleFamilyPrice;
            const condoPrice = neighborhood.condoPrice;

            if (geoJsonName && singleFamilyPrice) {
              const rawSingleFamily = singleFamilyPrice.replace(/[$,]/g, "");
              const rawCondo = condoPrice
                ? condoPrice.replace(/[$,]/g, "")
                : null;
              const color = getPriceColor(rawSingleFamily);

              neighborhoodMapping[geoJsonName] = {
                initials: generateInitials(geoJsonName),
                color: color,
                price: singleFamilyPrice,
                singleFamilyPrice: singleFamilyPrice,
                condoPrice: condoPrice,
                rawSingleFamily: rawSingleFamily,
                rawCondo: rawCondo,
              };
            }
          });

          // Add some missing neighborhoods with default values
          const additionalNeighborhoods = {
            "L'Île-Dorval": {
              initials: "ID",
              color: "#F7D794",
              price: "$1.5M",
            },
          };

          Object.assign(neighborhoodMapping, additionalNeighborhoods);

          // Enrich features with data
          filteredGeoJsonData.features.forEach((feature) => {
            const boroughName = feature.properties.nom_arr;
            const neighborhoodName = feature.properties.nom_qr;
            const municipalityName = feature.properties.nom_mun;
            const partDirection = feature.properties.part; // Get the part (East, West, South, North)

            // Determine scope: Borough (part of Montreal) or Suburb (independent municipality)
            const scope = boroughName ? "Borough" : "Suburb";

            // Try to match by borough first, then by municipality/neighborhood for independent cities
            const lookupName =
              boroughName || municipalityName || neighborhoodName;

            // Apply name mapping to handle variations
            const mappedLookupName = nameMapping[lookupName] || lookupName;
            const areaData = neighborhoodMapping[mappedLookupName];

            // Calculate geographic area from geometry
            const areaInKm2 = calculateFeatureArea(feature.geometry);
            feature.properties.area = `${areaInKm2.toFixed(1)} km²`;
            feature.properties.scope = scope; // Add scope property

            if (areaData) {
              feature.properties.color = areaData.color;
              feature.properties.value = areaData.initials;
              feature.properties.avgPrice = areaData.price;
              feature.properties.singleFamilyPrice = areaData.singleFamilyPrice;
              feature.properties.condoPrice = areaData.condoPrice;
              feature.properties.listingCount =
                Math.floor(Math.random() * 150) + 50;
              feature.properties.priceChange = (Math.random() * 15 + 5).toFixed(
                1
              );
              feature.properties.pricePerSqft =
                Math.floor(Math.random() * 200) + 300; // Store as consistent value
              feature.properties.name = lookupName; // Use lookupName instead of boroughName
              feature.properties.neighborhood = neighborhoodName;
              feature.properties.rawSingleFamily = areaData.rawSingleFamily;
              feature.properties.rawCondo = areaData.rawCondo;
            } else {
              const isSuburb = !boroughName || boroughName !== "Montréal";
              // Use part-based color if available, otherwise use default
              const colorBasedOnPart = getColorByPart(partDirection);
              const defaultColor = isSuburb ? "#80CBC4" : colorBasedOnPart;
              const defaultPrice = isSuburb ? "$550K" : "$520K";

              feature.properties.color = defaultColor;
              feature.properties.value = generateAbbreviation(
                neighborhoodName || boroughName
              );
              feature.properties.avgPrice = defaultPrice;
              feature.properties.listingCount =
                Math.floor(Math.random() * 100) + 30;
              feature.properties.priceChange = (Math.random() * 15 + 5).toFixed(
                1
              );
              feature.properties.pricePerSqft =
                Math.floor(Math.random() * 200) + 300; // Store as consistent value
              feature.properties.name =
                boroughName || neighborhoodName || "Unknown Area";
              feature.properties.neighborhood =
                neighborhoodName || "Unknown Neighborhood";
              feature.properties.rawSingleFamily = null;
              feature.properties.rawCondo = null;
            }

            feature.properties.type = "neighborhood";
            feature.properties.municipality =
              feature.properties.nom_mun || "Montréal";
          }); // Unified appearance metadata
          const processedData = {
            ...filteredGeoJsonData,
            features: filteredGeoJsonData.features.map((feature) => {
              if (feature.properties.merged_from > 1) {
                return {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    isMerged: true,
                    className: "merged-borough",
                  },
                };
              }
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  className: "single-borough",
                },
              };
            }),
          };

          // Rotate the GeoJSON data with scaling to fix aspect ratio
          const centerPoint = { lat: 45.48, lng: -73.62 }; // Montreal center
          const rotatedData = rotateGeoJSON(
            processedData,
            335,
            centerPoint,
            1.2,
            1
          ); // 335° rotation, wider horizontally, shorter vertically

          // Rotate iconic locations with the same parameters
          const rotatedIconicLocations = rotateIconicLocations(
            ICONIC_LOCATIONS,
            335,
            centerPoint,
            1.2,
            1
          );

          // Keep both: rotated (default) and unrotated (top view)
          setMontrealData(rotatedData);
          setMontrealDataTop(processedData);
          setIconicLocations(rotatedIconicLocations);
          setAllPois(poisData.elements);
          setAllMetro(metroData);
          setAllTrains(trainsData);
          setAllRem(remData);
          setAllDaycares(daycaresData);

          // Debug: Log loaded transit and daycare data
          console.log("🚇 Loaded transit & daycare data:", {
            metroCount: metroData?.length || 0,
            trainsCount: trainsData?.length || 0,
            remCount: remData?.length || 0,
            daycaresCount: daycaresData?.length || 0,
            metroSample: metroData?.[0],
            trainsSample: trainsData?.[0],
            remSample: remData?.[0],
            daycaresSample: daycaresData?.[0],
          });

          setIsMapLoaded(true);
        }
      )
      .catch((error) => console.error("Error loading Montreal data:", error));
  }, [selectedPart, partGeoJSON]);

  // Initialize neighborhoods as hidden when map loads
  useEffect(() => {
    if (isMapLoaded && montrealData) {
      console.log("Initializing neighborhoods as hidden...");
      const timer = setTimeout(() => {
        const hiddenCount = applyInitialHiddenState();
        console.log(`Hidden ${hiddenCount} neighborhoods`);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isMapLoaded, montrealData, applyInitialHiddenState]);

  // Center and zoom to selected part
  useEffect(() => {
    if (!map || (!selectedPart && lastFocusedPartRef.current === null)) {
      return;
    }

    if (!selectedPart) {
      if (lastFocusedPartRef.current !== null) {
        lastFocusedPartRef.current = null;
        map.flyTo([45.56, -73.62], 10.8, { duration: 0.6 });
      }
      return;
    }

    const featureSource =
      montrealDataTop?.features || montrealData?.features || [];

    if (!featureSource.length) {
      return;
    }

    if (lastFocusedPartRef.current === selectedPart) {
      return;
    }

    const matchingFeatures = featureSource.filter(
      (feature) => feature?.properties?.part === selectedPart
    );

    const featuresToFocus = matchingFeatures.length
      ? matchingFeatures
      : featureSource;

    focusMapOnFeatures(featuresToFocus, selectedPart);
    lastFocusedPartRef.current = selectedPart;
  }, [selectedPart, map, montrealDataTop, montrealData, focusMapOnFeatures]);

  // Set flag when animation should start and trigger if map is already ready
  useEffect(() => {
    // Don't animate when viewing a specific part
    if (selectedPart) {
      setShouldAnimateNeighborhoods(false);
      return;
    }

    if (startNeighborhoodAnimation) {
      console.log("🎯 Animation requested, map ready:", !!map);
      setShouldAnimateNeighborhoods(true);

      if (montrealData) {
        console.log(
          "🚀 Map already ready - triggering animations immediately!"
        );
        setTimeout(() => {
          triggerNeighborhoodAnimations();
        }, 500);
      }
    }
  }, [
    startNeighborhoodAnimation,
    map,
    montrealData,
    triggerNeighborhoodAnimations,
    selectedPart,
  ]);

  // Fallback: Also try to trigger when map becomes available after animation request
  useEffect(() => {
    if (shouldAnimateNeighborhoods && montrealData) {
      console.log(
        "🔄 Fallback trigger - map became ready after animation request"
      );
      setTimeout(() => {
        triggerNeighborhoodAnimations();
      }, 1000);
    }
  }, [shouldAnimateNeighborhoods, montrealData, triggerNeighborhoodAnimations]);

  // Style function - Yellow Glowing Like BoomSold Logo Burst
  const getFeatureStyle = (feature) => {
    const name = feature?.properties?.name || feature?.properties?.nom_arr;
    const isPinnedActive = !!localPinnedName;
    const isPinnedFeature = isPinnedActive && localPinnedName === name;

    const base = {
      fillColor: "#FFD700", // Bright gold yellow like logo burst
      weight: isMobile ? 0.3 : 6,
      opacity: 1,
      color: isMobile ? "#000000" : "#FFFFFF",
      fillOpacity: 0.9,
      lineJoin: "round",
      lineCap: "round",
    };

    if (isPinnedActive) {
      if (isPinnedFeature) {
        return {
          ...base,
          weight: isMobile ? 1 : 7,
          fillOpacity: 1,
          color: "#000000", // emphasize border
        };
      }
      // Dim non-pinned neighborhoods
      return {
        ...base,
        fillOpacity: 0.25,
        color: "#CCCCCC",
        fillColor: "#D4D4A5", // muted yellow/grey
      };
    }
    return base;
  };

  const getHoverStyle = () => ({
    weight: isMobile ? 3 : 6, // Match the default weight based on device
    color: "#000000", // Black border on hover
    fillOpacity: 1,
    opacity: 1,
    lineJoin: "round",
    fillColor: "#FFC107", // Brighter yellow on hover
    lineCap: "round",
  });

  // Filter features based on current filters
  const getFilteredData = useCallback(() => {
    if (!montrealData) return null;

    const filteredFeatures = montrealData.features.filter((feature) => {
      // Filter by scope (Borough/Suburb)
      const scope = feature.properties.scope;
      if (scope === "Borough" && !filters.showBoroughs) return false;
      if (scope === "Suburb" && !filters.showSuburbs) return false;

      // Filter by minimum area
      const areaStr = feature.properties.area;
      if (areaStr) {
        const areaValue = parseFloat(areaStr.replace(" km²", ""));
        if (areaValue < filters.minArea) return false;
      }

      // Accessibility filters (placeholder for future implementation)
      // if (filters.accessibility.parks && !feature.properties.hasParks) return false;
      // if (filters.accessibility.schools && !feature.properties.hasSchools) return false;
      // if (filters.accessibility.hospitals && !feature.properties.hasHospitals) return false;

      return true;
    });

    return {
      ...montrealData,
      features: filteredFeatures,
    };
  }, [montrealData, filters]);

  // -------- Google Images + Wikipedia helpers --------
  // Removed unused external image fetch helpers

  // Removed unused getPlaceImage helper
  // ---------------------------------------------------

  // Feature interaction handlers
  const onEachFeature = useCallback(
    (feature, layer) => {
      const originalStyle = getFeatureStyle(feature);
      const finalColor = feature.properties.color || "#4DD0E1";

      // Apply the final color directly
      layer.setStyle(originalStyle);

      // Wait for element to be rendered, then set final styling
      const applyStyle = () => {
        requestAnimationFrame(() => {
          const pathElement = layer.getElement();
          if (pathElement) {
            pathElement.style.setProperty("--final-color", finalColor);
          }
        });
      };

      // Ensure layer is added to map before applying styling
      setTimeout(applyStyle, 100);

      // Add permanent tooltip with dynamic font size based on zoom (desktop only)
      if (feature.properties && feature.properties.name && !isMobile) {
        const abbreviatedName = getAbbreviatedName(feature.properties.name);

        const updateTooltip = () => {
          // Guard against updates after unmount or layer removal
          // if (!map || !layer || !layer._map) return;
          const zoom = map ? map.getZoom() : currentZoom;
          const clampedZoom = Math.max(6, Math.min(21, Math.round(zoom)));
          const zoomClass = `custom-tooltip tooltip-zoom-${clampedZoom}`;

          // For MultiPolygon, find the largest part and use its center
          let centerPoint;

          if (feature.geometry.type === "MultiPolygon") {
            // Find the largest polygon by area
            let largestArea = 0;
            let largestPolygonCoords = null;

            feature.geometry.coordinates.forEach((poly) => {
              const ring = poly[0]; // outer ring
              // Calculate area using shoelace formula
              const area = Math.abs(
                ring.reduce((sum, coord, i, arr) => {
                  if (i === arr.length - 1) return sum;
                  return (
                    sum + (coord[0] * arr[i + 1][1] - arr[i + 1][0] * coord[1])
                  );
                }, 0) / 2
              );

              if (area > largestArea) {
                largestArea = area;
                largestPolygonCoords = ring;
              }
            });

            // Calculate center of the largest polygon
            if (largestPolygonCoords) {
              const lats = largestPolygonCoords.map((c) => c[1]);
              const lngs = largestPolygonCoords.map((c) => c[0]);
              let lat = (Math.min(...lats) + Math.max(...lats)) / 2;
              let lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

              // Apply specific adjustments for problematic neighborhoods
              const name = feature.properties.name;
              if (
                name.includes("Rivière-des-Prairies") ||
                name.includes("RDP")
              ) {
                lat += 0.01; // Move RDP up
              } else if (name.includes("Dorval")) {
                lat -= 0.008; // Move Dorval down
              } else if (name.includes("Senneville")) {
                lat += 0.007; // Move Senneville down
                lng -= 0.01; // Move Senneville left
              } else if (name.includes("Lachine")) {
                lng -= 0.015; // Move Lachine a little more left
              } else if (name.includes("LaSalle")) {
                lng -= 0.01; // Move LaSalle a little left
                lat += 0.006; // Move LaSalle a little up
              } else if (name.includes("Kirkland")) {
                lat += 0.004; // Move Kirkland a little up
              } else if (name.includes("Pierrefonds")) {
                lng -= 0.05; // Move Pierrefonds left
                lat -= 0.008; // Move Pierrefonds down
              } else if (name.includes("Mont-Royal")) {
                lng += 0.008; // Move Mont-Royal a little right
              } else if (
                name.includes("Côte-des-Neiges") ||
                name.includes("Notre-Dame-de-Grâce") ||
                name.includes("CDN") ||
                name.includes("NDG")
              ) {
                lng += 0.001; // Move CDN-NDG right
                lat -= 0.015; // Move CDN-NDG up
              } else if (
                name.includes("Sud-Ouest") ||
                name.includes("Le Sud-Ouest")
              ) {
                lat += 0.008; // Move Le Sud-Ouest up
              }

              centerPoint = L.latLng(lat, lng);
            }
          } else {
            // For simple Polygon, use layer bounds center
            const layerBounds = layer.getBounds();
            centerPoint = layerBounds.getCenter();
          }

          // Remove existing tooltip
          layer.unbindTooltip();

          // Create new tooltip at the calculated center
          layer
            .bindTooltip(abbreviatedName, {
              permanent: true,
              direction: "center",
              className: zoomClass,
              offset: [0, 0],
            })
            .openTooltip();

          // Force tooltip position at the center
          const tooltip = layer.getTooltip();
          if (tooltip && centerPoint) {
            tooltip.setLatLng(centerPoint);
          }
        };

        // Wait for layer to be fully rendered before calculating center
        setTimeout(() => {
          updateTooltip();
          if (map) {
            map.on("zoomend", updateTooltip);
            // Detach listener when this layer is removed to avoid updates on unmounted DOM
            layer.on("remove", () => {
              try {
                if (map) map.off("zoomend", updateTooltip);
                layer.unbindTooltip();
              } catch (e) {
                // ignore
              }
            });
          }
        }, 100);
      }

      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          const hoverStyle = getHoverStyle();
          layer.setStyle(hoverStyle);
          layer.bringToFront();

          const pathElement = layer.getElement();
          if (pathElement) {
            pathElement.style.transform = isMobile
              ? "translate(0, 0)"
              : "translate(0, -3px)"; // No projection on mobile
            pathElement.style.filter = isMobile
              ? "none" // No shadow on mobile
              : "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3))"; // Full shadow on desktop
            pathElement.style.transition = "none";
            pathElement.style.zIndex = "1000";
            pathElement.setAttribute("data-hovering", "true");
            // Force black border to persist
            pathElement.style.stroke = "#000000";
            pathElement.style.strokeWidth = isMobile ? "1" : "6"; // Match the reduced border width on mobile
          }

          // Calculate real POI counts for this neighborhood
          // CRITICAL: Use ORIGINAL UNROTATED geometry from montrealDataTop for accurate point-in-polygon testing
          // The rotated geometry coordinates won't match the actual POI lat/lon coordinates
          const featureName =
            feature.properties.name || feature.properties.nom_arr;
          const unrotatedFeature = montrealDataTop?.features?.find((f) => {
            const p = f.properties;
            const targetP = feature.properties;
            // Try exact name match
            if ((p.name || p.nom_arr) === featureName) return true;
            // Try matching by IDs if available
            if (p.no_qr && targetP.no_qr && p.no_qr === targetP.no_qr)
              return true;
            // Try matching by municipality name
            if (p.nom_mun && targetP.nom_mun && p.nom_mun === targetP.nom_mun)
              return true;
            return false;
          });
          
          const geometryToUse = unrotatedFeature?.geometry || feature.geometry;
          
          // Helper function to check if point is in neighborhood (handles both Polygon and MultiPolygon)
          // EXACT COPY from NeighborhoodMap.js
          const isPointInNeighborhood = (lat, lon) => {
            let inside = false;
            const testPoint = [lon, lat]; // [lng, lat] format - GeoJSON native

            if (geometryToUse.type === "MultiPolygon") {
              // Test against all polygons in the MultiPolygon
              for (const poly of geometryToUse.coordinates) {
                const ring = poly[0]; // Outer ring - NO coordinate conversion
                if (pointInPolygon(testPoint, ring)) {
                  inside = true;
                  break;
                }
              }
            } else if (geometryToUse.type === "Polygon") {
              const ring = geometryToUse.coordinates[0]; // Outer ring - NO coordinate conversion
              inside = pointInPolygon(testPoint, ring);
            }

            return inside;
          };

          // Ray casting algorithm to determine if point is inside polygon
          // EXACT COPY from NeighborhoodMap.js
          const pointInPolygon = (point, polygon) => {
            const x = point[0];
            const y = point[1];
            let inside = false;

            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
              const xi = polygon[i][0];
              const yi = polygon[i][1];
              const xj = polygon[j][0];
              const yj = polygon[j][1];

              // Ray casting: check if ray crosses polygon edge
              const yiAbovePoint = yi > y;
              const yjAbovePoint = yj > y;
              const edgeCrossesRay = yiAbovePoint !== yjAbovePoint;

              if (edgeCrossesRay) {
                const xIntersection = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
                if (x < xIntersection) {
                  inside = !inside;
                }
              }
            }

            return inside;
          };

          let parkCount = 0;
          let schoolCount = 0;
          let hospitalCount = 0;
          let restaurantCount = 0;
          let sportsCount = 0;
          let metroCount = 0;
          let trainsCount = 0;
          let remCount = 0;
          let daycaresCount = 0;

          allPois.forEach((poi) => {
            const amenity = poi.tags?.amenity;
            const leisure = poi.tags?.leisure;
            const sport = poi.tags?.sport;

            let lat, lon;
            if (poi.type === "node") {
              lat = poi.lat;
              lon = poi.lon;
            } else if (
              (poi.type === "way" || poi.type === "relation") &&
              poi.center
            ) {
              lat = poi.center.lat;
              lon = poi.center.lon;
            }

            if (lat && lon && isPointInNeighborhood(lat, lon)) {
              if (leisure === "park" || amenity === "park") parkCount++;
              else if (amenity === "school") schoolCount++;
              else if (amenity === "hospital") hospitalCount++;
              else if (
                amenity === "restaurant" ||
                amenity === "cafe" ||
                amenity === "fast_food"
              )
                restaurantCount++;
              else if (
                leisure === "sports_centre" ||
                leisure === "stadium" ||
                sport
              )
                sportsCount++;
            }
          });

          // Count metro stations
          console.log(`🚇 Counting metro for ${feature.properties.name}:`, {
            allMetroLength: allMetro.length,
            allMetroSample: allMetro[0],
          });
          allMetro.forEach((poi) => {
            if (poi.lat && poi.lon && isPointInNeighborhood(poi.lat, poi.lon)) {
              metroCount++;
            }
          });

          // Count train stations
          allTrains.forEach((poi) => {
            if (poi.lat && poi.lon && isPointInNeighborhood(poi.lat, poi.lon)) {
              trainsCount++;
            }
          });

          // Count REM stations
          allRem.forEach((poi) => {
            if (poi.lat && poi.lon && isPointInNeighborhood(poi.lat, poi.lon)) {
              remCount++;
            }
          });

          // Count daycares
          allDaycares.forEach((poi) => {
            if (poi.lat && poi.lon && isPointInNeighborhood(poi.lat, poi.lon)) {
              daycaresCount++;
            }
          });

          console.log(
            `🗺️ Calculated POI counts for ${
              feature.properties.name || feature.properties.nom_arr
            }:`,
            {
              parkCount,
              schoolCount,
              hospitalCount,
              restaurantCount,
              sportsCount,
              metroCount,
              trainsCount,
              remCount,
              daycaresCount,
              allPoisLength: allPois.length,
              geometryType: geometryToUse.type,
              usedUnrotated: !!unrotatedFeature,
            }
          );

          if (onNeighborhoodHover) {
            onNeighborhoodHover({
              // Basic Information
              name: feature.properties.name || feature.properties.nom_arr,
              neighborhood:
                feature.properties.neighborhood || feature.properties.nom_qr,
              municipality:
                feature.properties.municipality || feature.properties.nom_mun,

              // GeoJSON Reference Data
              neighborhoodId: feature.properties.no_qr,
              boroughId: feature.properties.no_arr,
              neighborhoodCode: feature.properties.value,

              // Real Estate Pricing (from CSV)
              averagePrice: feature.properties.avgPrice,
              singleFamilyPrice: feature.properties.singleFamilyPrice,
              condoPrice: feature.properties.condoPrice,

              // Additional Statistics
              dwellingCount: feature.properties.nb_log,
              listingCount: feature.properties.listingCount,
              pricePerSqft: `$${feature.properties.pricePerSqft}/sq ft`,
              marketTrend: `↗ +${feature.properties.priceChange}%`,
              area: feature.properties.area, // Geographic area in km²

              // POI Counts (calculated from real data)
              parkCount,
              schoolCount,
              hospitalCount,
              restaurantCount,
              sportsCount,
              metroCount,
              trainsCount,
              remCount,
              daycaresCount,

              // Raw Data (for debugging/complete info)
              rawProperties: {
                no_qr: feature.properties.no_qr,
                nom_qr: feature.properties.nom_qr,
                no_arr: feature.properties.no_arr,
                nom_arr: feature.properties.nom_arr,
                nom_mun: feature.properties.nom_mun,
                nb_log: feature.properties.nb_log,
                rawSingleFamily: feature.properties.rawSingleFamily,
                rawCondo: feature.properties.rawCondo,
              },

              description: `Complete real estate data for ${
                feature.properties.name || feature.properties.nom_arr
              }`,
            });
          }
        },
        mouseout: (e) => {
          const layer = e.target;
          const pathElement = layer.getElement();

          // Check if still hovering (prevents premature reset)
          if (
            pathElement &&
            pathElement.getAttribute("data-hovering") === "true"
          ) {
            pathElement.removeAttribute("data-hovering");
          }

          layer.setStyle(originalStyle);

          if (pathElement) {
            pathElement.style.transform = "translate(0, 0)";
            pathElement.style.filter = "none";
            pathElement.style.transition = "none";
            pathElement.style.zIndex = "auto";
            // Reset border to original white
            pathElement.style.stroke = "#FFFFFF";
            pathElement.style.strokeWidth = "6";
          }

          if (onNeighborhoodLeave) {
            onNeighborhoodLeave();
          }
        },
        click: () => {
          // Ensure map is set from ref if not available
          let leafletMap = map;
          if (
            !leafletMap &&
            geoJsonLayerRef.current &&
            geoJsonLayerRef.current._map
          ) {
            leafletMap = geoJsonLayerRef.current._map;
            setMap(leafletMap);
          }
          // If clicking the currently pinned neighborhood, unpin but continue to navigate into it
          let wasPinnedSame = false;
          if (localPinnedName && localPinnedName === feature.properties.name) {
            setLocalPinnedName(null);
            wasPinnedSame = true; // don't reset view; proceed below
          }

          // Filter GeoJSON to only show clicked neighborhood
          const clickedNeighborhoodName =
            feature.properties.name || feature.properties.nom_arr;
          const filteredGeoJSON = {
            type: "FeatureCollection",
            features: montrealDataTop.features.filter(
              (f) =>
                (f.properties.name || f.properties.nom_arr) ===
                clickedNeighborhoodName
            ),
          };

          // Zoom to neighborhood bounds
          if (feature.geometry && feature.geometry.coordinates && leafletMap) {
            let allCoords = [];
            if (feature.geometry.type === "MultiPolygon") {
              feature.geometry.coordinates.forEach((poly) => {
                poly.forEach((ring) => {
                  allCoords = allCoords.concat(ring);
                });
              });
            } else if (feature.geometry.type === "Polygon") {
              feature.geometry.coordinates.forEach((ring) => {
                allCoords = allCoords.concat(ring);
              });
            }
            const lats = allCoords.map((c) => c[1]);
            const lngs = allCoords.map((c) => c[0]);
            const southWest = [Math.min(...lats), Math.min(...lngs)];
            const northEast = [Math.max(...lats), Math.max(...lngs)];
            const bounds = [
              [southWest[0], southWest[1]],
              [northEast[0], northEast[1]],
            ];
            leafletMap.fitBounds(bounds, { maxZoom: 15, padding: [50, 50] });
          } else {
            console.log("Error: No geometry, coordinates, or map found.");
          }
          if (onNeighborhoodClick) {
            onNeighborhoodClick({
              name: feature.properties.name || feature.properties.nom_arr,
              neighborhood:
                feature.properties.neighborhood || feature.properties.nom_qr,
              municipality:
                feature.properties.municipality || feature.properties.nom_mun,
              neighborhoodId: feature.properties.no_qr,
              boroughId: feature.properties.no_arr,
              neighborhoodCode: feature.properties.value,
              averagePrice: feature.properties.avgPrice,
              singleFamilyPrice: feature.properties.singleFamilyPrice,
              condoPrice: feature.properties.condoPrice,
              dwellingCount: feature.properties.nb_log,
              listingCount: feature.properties.listingCount,
              pricePerSqft: `$${feature.properties.pricePerSqft}/sq ft`,
              marketTrend: `↗ +${feature.properties.priceChange}%`,
              area: feature.properties.area, // Geographic area in km²
              rawProperties: {
                no_qr: feature.properties.no_qr,
                nom_qr: feature.properties.nom_qr,
                no_arr: feature.properties.no_arr,
                nom_arr: feature.properties.nom_arr,
                nom_mun: feature.properties.nom_mun,
                nb_log: feature.properties.nb_log,
                rawSingleFamily: feature.properties.rawSingleFamily,
                rawCondo: feature.properties.rawCondo,
              },
              description: `Detailed property exploration for ${
                feature.properties.name || feature.properties.nom_arr
              }`,
              isClickEvent: true,
              filteredGeoJSON: filteredGeoJSON, // Pass filtered GeoJSON
              // Inform parent what happened with pin state
              isPin: !wasPinnedSame,
              wasPinnedUnpinned: wasPinnedSame,
            });
            // Only set pin if it wasn't already pinned (we just unpinned above)
            if (!wasPinnedSame) {
              setLocalPinnedName(
                feature.properties.name || feature.properties.nom_arr
              );
            }
          }
        },
      });
    },
    [
      allPois,
      allMetro,
      allTrains,
      allRem,
      allDaycares,
      isMobile,
      map,
      currentZoom,
      onNeighborhoodHover,
      onNeighborhoodClick,
      localPinnedName,
      montrealDataTop,
    ]
  );

  // Get part-specific center and zoom - Responsive based on screen size
  const getPartConfig = useCallback(() => {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    // Adjust zoom based on screen size
    const zoomAdjustment = isMobile ? -0.5 : isTablet ? -0.3 : 0;

    // Mobile-specific center adjustments (push North/East down)
    const partConfigs = {
      North: {
        center: isMobile ? [45.65, -73.48] : [45.58, -73.48], // Moved up for mobile (was 45.78)
        zoom: isMobile ? 11.6 + zoomAdjustment : 12 + zoomAdjustment,
      },
      South: {
        center: isMobile ? [45.5, -73.62] : [45.48, -73.55],
        zoom: isMobile ? 11.7 + zoomAdjustment : 12.2 + zoomAdjustment,
      },
      Central: {
        center: isMobile ? [45.58, -73.67] : [45.56, -73.62],
        zoom: isMobile ? 11.5 + zoomAdjustment : 12 + zoomAdjustment,
      },
      East: {
        center: isMobile ? [45.2, -73.45] : [45.54, -73.45],
        zoom: isMobile ? 11 + zoomAdjustment : 12 + zoomAdjustment,
      },
      West: {
        center: isMobile ? [45.62, -73.88] : [45.58, -73.85], // Moved down for mobile (was 45.48)
        zoom: isMobile ? 11 : 12 + zoomAdjustment,
      },
    };

    if (selectedPart && partConfigs[selectedPart]) {
      return partConfigs[selectedPart];
    }

    // Default: full Montreal view using dynamic zoom level
    return { center: [45.56, -73.62], zoom: zoomLevel };
  }, [selectedPart, zoomLevel]);

  const { center, zoom } = getPartConfig();

  // Removed unused placeTypeLabel

  // Cleanup on unmount: remove map listeners and unbind tooltips
  useEffect(() => {
    const localMap = map;
    const localLayerGroup = geoJsonLayerRef.current;
    return () => {
      try {
        if (localMap) localMap.off();
      } catch (e) {
        // ignore
      }
      if (localLayerGroup) {
        try {
          localLayerGroup.eachLayer((layer) => {
            try {
              layer.unbindTooltip();
            } catch (e) {}
          });
        } catch (e) {
          // ignore
        }
      }
    };
  }, [map]);

  // Add resize listener for responsive behavior
  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      const { center, zoom } = getPartConfig();
      map.setView(center, zoom, { animate: false });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map, getPartConfig]);

  // const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  if (!montrealData) {
    return (
      <div className="mm-custom-montreal-map">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "18px",
            color: "#2d3436",
          }}
        >
          Loading Montreal Map...
        </div>
      </div>
    );
  }

  return (
    <div className="montreal-map-container">
      {/* Professional Header */}
      {/* <ProfessionalHeader /> */}

      {/* Montreal Flag Section - Above Map */}
      {/* <MontrealSvg /> */}

      {/* Back Button - Only show when viewing a specific part */}
      {selectedPart && onPartBack && (
        <button
          onClick={onPartBack}
          style={{
            position: "fixed",
            top: isMobile ? "120px" : "120px",
            left: isMobile ? "3%" : "5%",
            zIndex: 1000,
            padding: isMobile ? "8px 16px" : "12px 24px",
            backgroundColor: "#FFD700",
            color: "#000000ff",
            border: "2px solid #FFD700",
            borderRadius: isMobile ? "6px" : "8px",
            fontSize: isMobile ? "12px" : "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow:
              "0 0 15px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "4px" : "8px",
            fontFamily:
              "'DM Serif Display', 'Arial Black', 'Arial Bold', 'Helvetica', sans-serif",
          }}
        >
          <span style={{ fontSize: isMobile ? "14px" : "20px" }}>←</span>
          <span>{t('back')}</span>
        </button>
      )}

      <div
        className="mm-custom-montreal-map"
        style={{ background: "transparent" }}
      >
        <h2
          className="selected-part-label"
          style={isMobile ? { marginTop: "180px", width: "100%" } : {}}
        >
          {selectedPart === "South"
            ? t('neighborhoods.downtownCenterSouth')
            : selectedPart === "West"
            ? t('neighborhoods.westIsland')
            : selectedPart === "North"
            ? t('neighborhoods.eastNorth')
            : `${t('neighborhoods.montreal')} ${selectedPart}`}
        </h2>

        {isMobile && (
          <h3
            style={{
              position: "fixed",
              top: "220px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "400px",

              borderRadius: "12px",
              padding: "12px",

              fontSize: "11px",
            }}
          >
            Please tap on a neighborhood to explore detailed real estate data,
          </h3>
        )}


           {/* Map Legend - Right Bottom */}
        {!isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: "20vh",
              right: "30px",
              zIndex: 1,
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              transition: "all 0.3s ease",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: isLegendExpanded ? "wrap" : "nowrap",
                gap: "16px",
                alignItems: "center",
                maxWidth: isLegendExpanded ? "300px" : "auto",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "18px" }}>🌳</span>
                <span
                  style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}
                >
                  {t('poi.parks')}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "18px" }}>🏫</span>
                <span
                  style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}
                >
                  {t('poi.schools')}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "18px" }}>🏥</span>
                <span
                  style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}
                >
                  {t('poi.hospitals')}
                </span>
              </div>

              {isLegendExpanded && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>🍽️</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {t('poi.restaurants')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>⚽</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {t('poi.sports')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>🚇</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {t('poi.metro')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>🚆</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {t('poi.trains')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>⚡</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {t('poi.rem')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>👶</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {t('poi.daycares')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0",
                textAlign: "left",
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isLegendExpanded ? t('legend.showLess') : t('legend.viewMore')}
            </button>
          </div>
        )}

        {/* Neighborhood List - Mobile Only - Below Map */}
        {isMobile && montrealData && (
          <div
            style={{
              position: "fixed",
              top: "250px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "400px",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              padding: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              fontSize: "11px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "0 0 8px 0",
                borderBottom: "2px solid #FFD700",
                paddingBottom: "8px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#000",
                }}
              >
                Neighborhoods (
                {getFilteredData()?.features.filter(
                  (f, i, arr) =>
                    arr.findIndex(
                      (item) =>
                        (item.properties.name || item.properties.nom_arr) ===
                        (f.properties.name || f.properties.nom_arr)
                    ) === i
                ).length || 0}
                )
              </h4>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {getFilteredData()
                ?.features.map((f) => ({
                  name: f.properties.name || f.properties.nom_arr,
                  feature: f,
                }))
                .filter(
                  (item, index, self) =>
                    self.findIndex((i) => i.name === item.name) === index
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      // Trigger click on the neighborhood
                      if (onNeighborhoodClick && item.feature) {
                        const feature = item.feature;

                        // Get the map instance
                        let leafletMap = map;
                        if (!leafletMap && geoJsonLayerRef.current?._map) {
                          leafletMap = geoJsonLayerRef.current._map;
                          setMap(leafletMap);
                        }

                        // Filter GeoJSON to only show clicked neighborhood
                        const filteredGeoJSON = {
                          type: "FeatureCollection",
                          features: montrealDataTop.features.filter(
                            (f) =>
                              (f.properties.name || f.properties.nom_arr) ===
                              item.name
                          ),
                        };

                        // Zoom to neighborhood bounds
                        if (feature.geometry?.coordinates && leafletMap) {
                          let allCoords = [];
                          if (feature.geometry.type === "MultiPolygon") {
                            feature.geometry.coordinates.forEach((poly) =>
                              poly.forEach((ring) => allCoords.push(...ring))
                            );
                          } else if (feature.geometry.type === "Polygon") {
                            feature.geometry.coordinates.forEach((ring) =>
                              allCoords.push(...ring)
                            );
                          }
                          const lats = allCoords.map((c) => c[1]);
                          const lngs = allCoords.map((c) => c[0]);
                          const bounds = [
                            [Math.min(...lats), Math.min(...lngs)],
                            [Math.max(...lats), Math.max(...lngs)],
                          ];
                          leafletMap.fitBounds(bounds, {
                            maxZoom: 15,
                            padding: [50, 50],
                          });
                        }

                        // If clicking the currently pinned item from the list, unpin first (but still navigate)
                        const wasPinnedSame = localPinnedName === item.name;
                        if (wasPinnedSame) {
                          setLocalPinnedName(null);
                        }

                        // Call the click handler
                        onNeighborhoodClick({
                          name:
                            feature.properties.name ||
                            feature.properties.nom_arr,
                          neighborhood:
                            feature.properties.neighborhood ||
                            feature.properties.nom_qr,
                          municipality:
                            feature.properties.municipality ||
                            feature.properties.nom_mun,
                          neighborhoodId: feature.properties.no_qr,
                          boroughId: feature.properties.no_arr,
                          neighborhoodCode: feature.properties.value,
                          averagePrice: feature.properties.avgPrice,
                          singleFamilyPrice:
                            feature.properties.singleFamilyPrice,
                          condoPrice: feature.properties.condoPrice,
                          dwellingCount: feature.properties.nb_log,
                          listingCount: feature.properties.listingCount,
                          pricePerSqft: `$${feature.properties.pricePerSqft}/sq ft`,
                          marketTrend: `↗ +${feature.properties.priceChange}%`,
                          area: feature.properties.area,
                          scope: feature.properties.scope,
                          rawProperties: {
                            no_qr: feature.properties.no_qr,
                            nom_qr: feature.properties.nom_qr,
                            no_arr: feature.properties.no_arr,
                            nom_arr: feature.properties.nom_arr,
                            nom_mun: feature.properties.nom_mun,
                            nb_log: feature.properties.nb_log,
                            rawSingleFamily: feature.properties.rawSingleFamily,
                            rawCondo: feature.properties.rawCondo,
                          },
                          description: `Detailed property exploration for ${item.name}`,
                          isClickEvent: true,
                          filteredGeoJSON: filteredGeoJSON,
                          wasPinnedUnpinned: wasPinnedSame,
                        });
                      }
                    }}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "#333",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFD700";
                      e.currentTarget.style.borderColor = "#FFC107";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#f9f9f9" : "#fff";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {getAbbreviatedName(item.name)}
                  </div>
                ))}
            </div>
          </div>
        )}

        {!isMobile && (
          <MapContainer
            center={center}
            verticalFactor={0.5}
            zoom={zoom}
            minZoom={selectedPart ? 10 : 6}
            maxZoom={22}
            /* Allow fractional zoom levels (default Leaflet zoomSnap=1 forces integers) */
            zoomSnap={0.1}
            zoomDelta={0.2}
            style={{ height: "100%", width: "100%", background: "transparent" }}
            zoomControl={false} //{isMobile}
            scrollWheelZoom={false}
            doubleClickZoom={true}
            touchZoom={true}
            boxZoom={true}
            keyboard={true}
            zoomAnimation={true}
            fadeAnimation={true}
            markerZoomAnimation={true}
            attributionControl={false}
            whenCreated={(mapInstance) => {
              setMap(mapInstance);

              // Ensure runtime options permit fractional zoom even for programmatic flyTo / fitBounds
              mapInstance.options.zoomSnap = 0.1;
              mapInstance.options.zoomDelta = 0.2;
              // Optional: smoother animation easing
              mapInstance.options.zoomAnimation = true;
              mapInstance.options.zoomAnimationThreshold = 8;

              // Add custom zoom control with custom position
              const zoomControl = L.control.zoom({
                position: "topleft",
              });
              zoomControl.addTo(mapInstance);

              // Remove any default tile layers
              mapInstance.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                  mapInstance.removeLayer(layer);
                }
              });

              // Disable scroll wheel zoom but keep touch zoom (pinch)
              mapInstance.scrollWheelZoom.disable();

              // Log center and zoom on zoom change
              mapInstance.on("zoomend", () => {
                const zoom = mapInstance.getZoom();
                const center = mapInstance.getCenter();
                setCurrentZoom(zoom);
                console.log("📍 Current Center:", {
                  lat: center.lat.toFixed(6),
                  lng: center.lng.toFixed(6),
                });
                console.log("🔍 Current Zoom:", zoom.toFixed(2));
              });

              // Log center on move
              mapInstance.on("moveend", () => {
                const center = mapInstance.getCenter();
                const zoom = mapInstance.getZoom();
                console.log("🗺️ Map Moved - Center:", {
                  lat: center.lat.toFixed(6),
                  lng: center.lng.toFixed(6),
                });
                console.log("🔍 Zoom:", zoom.toFixed(2));
              });

              // if (shouldAnimateNeighborhoods && montrealData) {
              //   setTimeout(() => {
              //     triggerNeighborhoodAnimations();
              //   }, 1000);
              // }
            }}
          >
            <ZoomUpdater zoomLevel={zoomLevel} />
            {/* GeoJSON: Top view (unrotated) when zoomed, else rotated */}
            <GeoJSON
              data={getFilteredData() || montrealData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
              ref={geoJsonLayerRef}
              key={JSON.stringify(filters) + (localPinnedName || "none")} // Force re-render when filters or pin state change
            />

            {/* Iconic location markers */}
            {/* {iconicLocations.map((location) => (
              <Marker
                key={location.id}
                position={location.coordinates}
                icon={createIconicLocationIcon(location)}
              />
            ))} */}
          </MapContainer>
        )}

   

     

        {/* Filter Button - Hidden on Mobile */}
       

        {/* Filter Panel */}
        {/* {showFilterPanel && (
          <div
            style={{
              position: "fixed",
              bottom: "100px",
              right: "30px",
              zIndex: 1000,
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
              minWidth: "300px",
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                borderBottom: "2px solid #FFD700",
                paddingBottom: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#000",
                }}
              >
                Filter Neighborhoods
              </h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            {/* Scope Filter */}
            {/* <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: "10px",
                }}
              >
                Scope
              </h4>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.showBoroughs}
                  onChange={(e) =>
                    setFilters({ ...filters, showBoroughs: e.target.checked })
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#333" }}>
                  Show Boroughs (Montreal)
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.showSuburbs}
                  onChange={(e) =>
                    setFilters({ ...filters, showSuburbs: e.target.checked })
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#333" }}>
                  Show Suburbs (Independent)
                </span>
              </label>
            </div> */}

            {/* Area Filter */}
            {/* <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: "10px",
                }}
              >
                Minimum Area (km²)
              </h4>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.minArea}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minArea: parseFloat(e.target.value) || 0,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
                placeholder="Enter minimum area"
              />
            </div> */}

            {/* Accessibility Filter */}
            {/* <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: "10px",
                }}
              >
                Accessibility (Coming Soon)
              </h4>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  cursor: "pointer",
                  opacity: 0.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.accessibility.parks}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      accessibility: {
                        ...filters.accessibility,
                        parks: e.target.checked,
                      },
                    })
                  }
                  disabled
                  style={{
                    width: "18px",
                    height: "18px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#333" }}>
                  🌳 Has Parks
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  cursor: "pointer",
                  opacity: 0.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.accessibility.schools}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      accessibility: {
                        ...filters.accessibility,
                        schools: e.target.checked,
                      },
                    })
                  }
                  disabled
                  style={{
                    width: "18px",
                    height: "18px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#333" }}>
                  🏫 Has Schools
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  opacity: 0.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.accessibility.hospitals}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      accessibility: {
                        ...filters.accessibility,
                        hospitals: e.target.checked,
                      },
                    })
                  }
                  disabled
                  style={{
                    width: "18px",
                    height: "18px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#333" }}>
                  🏥 Has Hospitals
                </span>
              </label>
            </div> */}

            {/* Reset Button */}
            {/* <button
              onClick={() =>
                setFilters({
                  showBoroughs: true,
                  showSuburbs: true,
                  minArea: 0,
                  accessibility: {
                    parks: false,
                    schools: false,
                    hospitals: false,
                  },
                })
              }
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#f0f0f0",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                color: "#333",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#e0e0e0";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
              }}
            >
              Reset Filters
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default MontrealMap;
