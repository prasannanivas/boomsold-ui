import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { MapContainer, GeoJSON, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import "./NeighborhoodMap.css";
import "./PremiumEffects.css";
import { getNeighborhoodScores } from "../utils/walkabilityScores";
import enhancedWalkScores from "../data/enhancedWalkScores.json";
import WalkabilityScoresBadge from "./WalkabilityScoresBadge";
import PriceRequestModal from "./PriceRequestModal";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;

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

const NeighborhoodMap = ({ neighborhoodGeoJSON, neighborhoodInfo, onBack }) => {
  const { t } = useTranslation();
  const [map, setMap] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [selectedPOICategory, setSelectedPOICategory] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null); // Track clicked POI
  const [originalGeoJSON, setOriginalGeoJSON] = useState(null); // Store original unrotated GeoJSON
  const mapSectionRef = useRef(null); // Reference to map section for scrolling
  const poiListGridRef = useRef(null); // Reference to POI list grid for scroll preservation
  const poiListScrollPos = useRef(0); // Store scroll position
  const [poiCategories, setPOICategories] = useState({
    parks: [],
    schools: [],
    hospitals: [],
    restaurants: [],
    sports: [],
    metro: [],
    trains: [],
    rem: [],
    daycares: [],
  });

  const [modalState, setModalState] = useState({ isOpen: false, type: null });

  const openPriceModal = (type) => {
    setModalState({ isOpen: true, type });
  };

  const closePriceModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  // Get walkability scores for the neighborhood
  const neighborhoodName =
    neighborhoodInfo?.name ||
    neighborhoodGeoJSON?.features?.[0]?.properties?.name ||
    neighborhoodGeoJSON?.features?.[0]?.properties?.nom_arr;
  const walkabilityScores = getNeighborhoodScores(neighborhoodName);

  // Get enhanced scores (transit and bike details)
  const enhancedScores = enhancedWalkScores[neighborhoodName] || null;

  // Create custom icons for POI markers
  const createPOIIcon = (category) => {
    const iconMap = {
      parks: "🌳",
      schools: "🎓",
      hospitals: "🏥",
      restaurants: "🍽️",
      sports: "🏟️",
      metro: "🚇",
      trains: "🚆",
      rem: "⚡",
      daycares: "👶",
    };

    return L.divIcon({
      className: "custom-poi-marker",
      html: `<div style="font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconMap[category]}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  };

  // Handle POI click - scroll to map and mark location
  const handlePOIClick = (poi, category, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log("🎯 POI Clicked:", poi.name, "Category:", category);
    console.log("🗺️ Map instance:", map);
    console.log("📍 POI Coordinates:", poi.lat, poi.lon);
    console.log("📜 Map section ref:", mapSectionRef.current);

    if (!poi.lat || !poi.lon) {
      console.warn("❌ Cannot navigate - missing coordinates");
      return;
    }

    // Set the selected POI
    setSelectedPOI({ ...poi, category });

    // Only proceed with map navigation if map is initialized
    if (!map) {
      console.warn("⏳ Map not yet initialized, scrolling to map section");
      // Scroll to map section to trigger map initialization
      if (mapSectionRef.current) {
        mapSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
      return;
    }

    // Only scroll if map is not already visible
    // Check if map section is in viewport
    if (mapSectionRef.current) {
      const rect = mapSectionRef.current.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isVisible) {
        mapSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }

    // Just pan to POI location smoothly without changing zoom
    // This keeps the neighborhood in view
    setTimeout(() => {
      if (map && map.panTo) {
        map.panTo([poi.lat, poi.lon], {
          animate: true,
          duration: 1.0,
        });
      }
    }, 300);
  };

  // Load original unrotated GeoJSON for outline display
  useEffect(() => {
    fetch(
      process.env.PUBLIC_URL + "/quartierreferencehabitation_merged.geojson"
    )
      .then((response) => response.json())
      .then((geoJsonData) => {
        // Filter to only the current neighborhood by matching the name
        const filteredData = {
          type: "FeatureCollection",
          features: geoJsonData.features.filter((feature) => {
            const featureName =
              feature.properties.name ||
              feature.properties.nom_arr ||
              feature.properties.nom_qr;
            return featureName === neighborhoodName;
          }),
        };
        setOriginalGeoJSON(filteredData);
      })
      .catch((error) => {
        console.error("Error loading original GeoJSON:", error);
      });
  }, [neighborhoodName]);

  // Load POI data and filter by neighborhood bounds
  useEffect(() => {
    const loadPOIs = async () => {
      // Wait for originalGeoJSON to be loaded first
      if (
        !originalGeoJSON ||
        !originalGeoJSON.features ||
        !originalGeoJSON.features.length
      ) {
        console.log("⏳ Waiting for originalGeoJSON to load...");
        return;
      }

      try {
        const [
          parksDataRaw,
          schoolsDataRaw,
          hospitalsDataRaw,
          sportsDataRaw,
          restaurantDataRaw,
          metroDataRaw,
          trainsDataRaw,
          remDataRaw,
          daycaresDataRaw,
        ] = await Promise.all([
          fetch(process.env.PUBLIC_URL + "/assets/montreal_parks.json").then(
            (res) => res.json()
          ),
          fetch(process.env.PUBLIC_URL + "/assets/montreal_schools.json").then(
            (res) => res.json()
          ),
          fetch(
            process.env.PUBLIC_URL + "/assets/montreal_hospitals.json"
          ).then((res) => res.json()),
          fetch(process.env.PUBLIC_URL + "/assets/montreal_sports.json").then(
            (res) => res.json()
          ),
          fetch(
            process.env.PUBLIC_URL + "/assets/montreal_restaurants.json"
          ).then((res) => res.json()),
          fetch(process.env.PUBLIC_URL + "/assets/montreal_metro.json").then(
            (res) => res.json()
          ),
          fetch(process.env.PUBLIC_URL + "/assets/montreal_trains.json").then(
            (res) => res.json()
          ),
          fetch(process.env.PUBLIC_URL + "/assets/montreal_rem.json").then(
            (res) => res.json()
          ),
          fetch(process.env.PUBLIC_URL + "/assets/montreal_daycares.json").then(
            (res) => res.json()
          ),
        ]);

        // USE ORIGINAL GEOJSON (not rotated) for point-in-polygon test
        const feature = originalGeoJSON.features[0];

        console.log(`🔍 Starting POI filtering for ${neighborhoodName}`);
        console.log(`📐 Using ORIGINAL (unrotated) GeoJSON for filtering`);
        console.log(`📐 Geometry type: ${feature.geometry.type}`);

        // Helper function to check if point is STRICTLY inside the neighborhood polygon
        const isPointInNeighborhood = (lat, lon) => {
          // Ray casting algorithm for point-in-polygon test
          // This works for both Polygon and MultiPolygon
          let inside = false;

          const testPoint = [lon, lat]; // [lng, lat] format

          if (feature.geometry.type === "MultiPolygon") {
            // Test against all polygons in the MultiPolygon
            for (const poly of feature.geometry.coordinates) {
              const ring = poly[0]; // Outer ring
              if (pointInPolygon(testPoint, ring)) {
                inside = true;
                break;
              }
            }
          } else if (feature.geometry.type === "Polygon") {
            const ring = feature.geometry.coordinates[0]; // Outer ring
            inside = pointInPolygon(testPoint, ring);
          }

          return inside;
        };

        // Ray casting algorithm to determine if point is inside polygon
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

        // Filter POIs by neighborhood bounds
        const parks = (parksDataRaw.elements || []).filter((poi) =>
          isPointInNeighborhood(poi.lat, poi.lon)
        );

        const schools = (schoolsDataRaw.elements || []).filter((poi) =>
          isPointInNeighborhood(poi.lat, poi.lon)
        );

        const hospitals = (hospitalsDataRaw.elements || []).filter((poi) =>
          isPointInNeighborhood(poi.lat, poi.lon)
        );

        const restaurants = (restaurantDataRaw.elements || []).filter((poi) =>
          isPointInNeighborhood(poi.lat, poi.lon)
        );

        const sports = (sportsDataRaw.elements || []).filter((poi) =>
          isPointInNeighborhood(poi.lat, poi.lon)
        );

        // Filter transit and daycare data (they're already arrays, not wrapped in .elements)
        // Add unique IDs based on coordinates since these POIs don't have native IDs
        const metro = (metroDataRaw || [])
          .filter((poi) => isPointInNeighborhood(poi.lat, poi.lon))
          .map((poi, index) => ({
            ...poi,
            id: `metro-${poi.lat}-${poi.lon}-${index}`,
          }));

        const trains = (trainsDataRaw || [])
          .filter((poi) => isPointInNeighborhood(poi.lat, poi.lon))
          .map((poi, index) => ({
            ...poi,
            id: `train-${poi.lat}-${poi.lon}-${index}`,
          }));

        const rem = (remDataRaw || [])
          .filter((poi) => isPointInNeighborhood(poi.lat, poi.lon))
          .map((poi, index) => ({
            ...poi,
            id: `rem-${poi.lat}-${poi.lon}-${index}`,
          }));

        const daycares = (daycaresDataRaw || [])
          .filter((poi) => isPointInNeighborhood(poi.lat, poi.lon))
          .map((poi, index) => ({
            ...poi,
            id: `daycare-${poi.lat}-${poi.lon}-${index}`,
          }));

        setPOICategories({
          parks,
          schools,
          hospitals,
          restaurants,
          sports,
          metro,
          trains,
          rem,
          daycares,
        });

        console.log(
          "✅ POIs filtered (STRICT polygon containment) for neighborhood:",
          {
            parks: parks.length,
            schools: schools.length,
            hospitals: hospitals.length,
            restaurants: restaurants.length,
            sports: sports.length,
            metro: metro.length,
            trains: trains.length,
            rem: rem.length,
            daycares: daycares.length,
            total:
              parks.length +
              schools.length +
              hospitals.length +
              restaurants.length +
              sports.length +
              metro.length +
              trains.length +
              rem.length +
              daycares.length,
          }
        );
      } catch (error) {
        console.error("Error loading POIs:", error);
      }
    };

    loadPOIs();
  }, [originalGeoJSON, neighborhoodName]);

  // Calculate area of a polygon using shoelace formula and convert to km²
  const calculatePolygonArea = (coords) => {
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    area = Math.abs(area / 2);

    // Convert to approximate km² (rough approximation for Montreal lat/lng)
    // At Montreal's latitude (~45°), 1 degree ≈ 78.8 km (longitude) and 111.2 km (latitude)
    const kmPerDegreeLat = 111.2;
    const kmPerDegreeLng = 78.8;
    area = area * kmPerDegreeLat * kmPerDegreeLng;

    return area;
  };

  // Calculate total area of the neighborhood in km²
  const calculateNeighborhoodArea = (feature) => {
    let totalArea = 0;

    if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((poly) => {
        // Only use the outer ring (first array) for each polygon
        totalArea += calculatePolygonArea(poly[0]);
      });
    } else if (feature.geometry.type === "Polygon") {
      // Only use the outer ring (first array)
      totalArea += calculatePolygonArea(feature.geometry.coordinates[0]);
    }

    return totalArea;
  };

  // Calculate appropriate zoom level based on area (in km²)
  const calculateZoomLevel = (area) => {
    // Area thresholds (in km²)
    // These values are tuned for Montreal neighborhoods
    if (area > 50) return 11; // Very large (RDP, Île-Bizard)
    if (area > 40) return 11; // Large (St-Laurent, Ahuntsic)
    if (area > 30) return 12; // Medium-large
    if (area > 20) return 13; // Medium
    if (area > 10) return 13; // Small
    return 13; // Very small (Westmount, Hampstead)
  };

  // Calculate center and bounds from ORIGINAL (unrotated) GeoJSON
  const getNeighborhoodBounds = () => {
    // Use originalGeoJSON for accurate geographic centering
    if (
      !originalGeoJSON ||
      !originalGeoJSON.features ||
      !originalGeoJSON.features.length
    ) {
      return { center: [45.56, -73.62], bounds: null, maxZoom: 14 };
    }

    const feature = originalGeoJSON.features[0];
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

    if (allCoords.length === 0) {
      return { center: [45.56, -73.62], bounds: null, maxZoom: 14 };
    }

    const lats = allCoords.map((c) => c[1]);
    const lngs = allCoords.map((c) => c[0]);
    const southWest = [Math.min(...lats), Math.min(...lngs)];
    const northEast = [Math.max(...lats), Math.max(...lngs)];
    const bounds = [
      [southWest[0], southWest[1]],
      [northEast[0], northEast[1]],
    ];

    const centerLat = (southWest[0] + northEast[0]) / 2;
    const centerLng = (southWest[1] + northEast[1]) / 2;

    // Calculate area and determine appropriate zoom level
    const area = calculateNeighborhoodArea(feature);
    const maxZoom = calculateZoomLevel(area);

    console.log(
      `Neighborhood: ${feature.properties.name}, Area: ${area.toFixed(
        1
      )} km², Max Zoom: ${maxZoom}, Center: [${centerLat.toFixed(
        6
      )}, ${centerLng.toFixed(6)}]`
    );

    return { center: [centerLat, centerLng], bounds, maxZoom };
  };

  const { center, bounds, maxZoom } = getNeighborhoodBounds();

  // Outline-only style for the neighborhood (no fill, just borders)
  const getNeighborhoodOutlineStyle = () => ({
    fillColor: "transparent", // No fill
    weight: 4, // Bold black borders
    opacity: 1,
    color: "#000000", // Black borders
    fillOpacity: 0, // Completely transparent fill
    lineJoin: "round",
    lineCap: "round",
  });

  // Create an inverse mask layer to dim everything outside the neighborhood
  const createInverseMaskGeoJSON = () => {
    if (
      !originalGeoJSON ||
      !originalGeoJSON.features ||
      !originalGeoJSON.features.length
    ) {
      return null;
    }

    const feature = originalGeoJSON.features[0];

    // Create a much larger rectangle covering the entire map view and beyond
    // Extended bounds to cover all screen sizes
    const outerBounds = [
      [-74.5, 45.0], // SW - Extended further
      [-74.5, 46.0], // NW - Extended further
      [-72.5, 46.0], // NE - Extended further
      [-72.5, 45.0], // SE - Extended further
      [-74.5, 45.0], // Close polygon
    ];

    // Create a MultiPolygon with the outer bounds and the neighborhood as a hole
    let inverseMask;

    if (feature.geometry.type === "Polygon") {
      inverseMask = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            outerBounds,
            ...feature.geometry.coordinates, // Add neighborhood as holes
          ],
        },
      };
    } else if (feature.geometry.type === "MultiPolygon") {
      // For MultiPolygon, add all polygons as holes
      const holes = [];
      feature.geometry.coordinates.forEach((poly) => {
        holes.push(...poly);
      });

      inverseMask = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [outerBounds, ...holes],
        },
      };
    }

    return {
      type: "FeatureCollection",
      features: [inverseMask],
    };
  };

  const inverseMaskGeoJSON = createInverseMaskGeoJSON();

  // Style for the inverse mask (dimmed overlay)
  const getInverseMaskStyle = () => ({
    fillColor: "#000000",
    fillOpacity: 0.3, // 30% black overlay
    weight: 0,
    opacity: 0,
  });

  // Feature interaction handlers
  const onEachFeature = (feature, layer) => {
    // Add permanent tooltip with abbreviated neighborhood name at the center
    if (feature.properties && feature.properties.name) {
      const abbreviatedName = getAbbreviatedName(feature.properties.name);

      const updateTooltip = () => {
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
            if (name.includes("Rivière-des-Prairies") || name.includes("RDP")) {
              lat += 0.01; // Move RDP up
            } else if (name.includes("Dorval")) {
              lat -= 0.008; // Move Dorval down
            } else if (name.includes("Senneville")) {
              lng -= 0.015; // Move Senneville left
            } else if (name.includes("Lachine")) {
              lng -= 0.01; // Move Lachine left
            } else if (
              name.includes("Côte-des-Neiges") ||
              name.includes("Notre-Dame-de-Grâce") ||
              name.includes("CDN") ||
              name.includes("NDG")
            ) {
              lng += 0.008; // Move CDN-NDG right
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
        }
      }, 100);
    }
  };

  // Fit bounds only once when map is first created
  const hasInitializedBounds = useRef(false);
  useEffect(() => {
    if (map && bounds && originalGeoJSON && !hasInitializedBounds.current) {
      setTimeout(() => {
        console.log("🎯 Fitting map to neighborhood bounds:", bounds);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 0.5,
        });
        hasInitializedBounds.current = true;
      }, 200);
    }
  }, [map, bounds, originalGeoJSON]);

  // Handle selectedPOI when map becomes available
  useEffect(() => {
    if (map && selectedPOI && selectedPOI.lat && selectedPOI.lon) {
      // Pan to the selected POI when map is ready
      setTimeout(() => {
        if (map.panTo) {
          map.panTo([selectedPOI.lat, selectedPOI.lon], {
            animate: true,
            duration: 1.0,
          });
        }
      }, 500);
    }
  }, [map, selectedPOI]);

  // Restore scroll position in POI list after render
  useEffect(() => {
    if (poiListGridRef.current && poiListScrollPos.current > 0) {
      poiListGridRef.current.scrollTop = poiListScrollPos.current;
    }
  });

  // Enable pinch-to-zoom (trackpad) but disable scroll-to-zoom (mouse wheel)
  useEffect(() => {
    if (!map) return;

    const handleWheel = (e) => {
      // Allow zoom only if Ctrl key is pressed (standard for trackpad pinch on Windows/Chrome)
      if (e.ctrlKey) {
        return; // Let it propagate to Leaflet
      }

      // Prevent Leaflet from zooming on regular scroll
      e.stopPropagation();
    };

    const container = map.getContainer();
    // Use capture to intercept before Leaflet
    container.addEventListener("wheel", handleWheel, { capture: true });

    return () => {
      container.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [map]);

  if (!neighborhoodGeoJSON) {
    return (
      <div className="custom-montreal-map">
        <div className="neighborhood-loading">{t('loading')}</div>
      </div>
    );
  }

  // POI Category Panel Component
  const POICategoryPanel = () => {
    // Helper function to get filtered count for each category
    const getFilteredCount = (categoryPOIs) => {
      return categoryPOIs.filter((poi) => {
        const poiName = poi.name || poi.tags?.name || "";
        return poiName && poiName !== "Unnamed";
      }).length;
    };

    const categories = [
      {
        id: "parks",
        name: t('poi.parks'),
        icon: "🌳",
        color: "#4CAF50",
        count: getFilteredCount(poiCategories.parks || []),
      },
      {
        id: "schools",
        name: t('poi.schools'),
        icon: "🎓",
        color: "#2196F3",
        count: getFilteredCount(poiCategories.schools || []),
      },
      {
        id: "hospitals",
        name: t('poi.hospitals'),
        icon: "🏥",
        color: "#F44336",
        count: getFilteredCount(poiCategories.hospitals || []),
      },
      {
        id: "restaurants",
        name: t('poi.restaurants'),
        icon: "🍽️",
        color: "#FF9800",
        count: getFilteredCount(poiCategories.restaurants || []),
      },
      {
        id: "sports",
        name: t('poi.sports'),
        icon: "🏟️",
        color: "#9C27B0",
        count: getFilteredCount(poiCategories.sports || []),
      },
      {
        id: "metro",
        name: t('poi.metro'),
        icon: "🚇",
        color: "#FF5722",
        count: getFilteredCount(poiCategories.metro || []),
      },
      {
        id: "trains",
        name: t('poi.trains'),
        icon: "🚆",
        color: "#607D8B",
        count: getFilteredCount(poiCategories.trains || []),
      },
      {
        id: "rem",
        name: t('poi.rem'),
        icon: "⚡",
        color: "#00BCD4",
        count: getFilteredCount(poiCategories.rem || []),
      },
      {
        id: "daycares",
        name: t('poi.daycares'),
        icon: "👶",
        color: "#E91E63",
        count: getFilteredCount(poiCategories.daycares || []),
      },
    ];

    return (
      <div>
        <div className="poi-category-panel">
          {categories
            .filter((cat) => cat.count > 0)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedPOICategory(
                    selectedPOICategory === cat.id ? null : cat.id
                  );
                }}
                className={`poi-category-button ${
                  selectedPOICategory === cat.id ? "active" : ""
                }`}
                style={{
                  backgroundColor:
                    selectedPOICategory === cat.id ? cat.color : undefined,
                  color: selectedPOICategory === cat.id ? "#fff" : undefined,
                }}
              >
                <span className="poi-category-content">
                  <span className="poi-category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
                <span className="poi-category-count">{cat.count}</span>
              </button>
            ))}
        </div>
      </div>
    );
  };

  // POI List Component
  const POIList = () => {
    if (!selectedPOICategory) return null;

    const currentPOIs = poiCategories[selectedPOICategory] || [];

    // Filter out unnamed POIs and sort by detail richness
    const sortedPOIs = currentPOIs
      .filter((poi) => {
        const poiName = poi.name || poi.tags?.name || "";
        return poiName && poiName !== "Unnamed";
      })
      .sort((a, b) => {
        const aName = a.name || a.tags?.name || "";
        const bName = b.name || b.tags?.name || "";

        // Count details for each POI
        const aDetails = [
          aName,
          a.address,
          a.cuisine,
          a.sport,
          a.phone,
          a.website,
          a.openingHours,
        ].filter(Boolean).length;

        const bDetails = [
          bName,
          b.address,
          b.cuisine,
          b.sport,
          b.phone,
          b.website,
          b.openingHours,
        ].filter(Boolean).length;

        // Sort by number of details (descending)
        if (aDetails !== bDetails) {
          return bDetails - aDetails;
        }

        // Otherwise, alphabetically by name
        return aName.localeCompare(bName);
      });

    const categoryInfo = {
      parks: { icon: "🌳", color: "#4CAF50" },
      schools: { icon: "🎓", color: "#2196F3" },
      hospitals: { icon: "🏥", color: "#F44336" },
      restaurants: { icon: "🍽️", color: "#FF9800" },
      sports: { icon: "🏟️", color: "#9C27B0" },
      metro: { icon: "🚇", color: "#FF5722" },
      trains: { icon: "🚆", color: "#607D8B" },
      rem: { icon: "⚡", color: "#00BCD4" },
      daycares: { icon: "👶", color: "#E91E63" },
    };

    const info = categoryInfo[selectedPOICategory];

    return (
      <div className="poi-list-container">
        <div className="poi-list-header">
          <h3 className="poi-list-title">
            <span className="poi-list-icon">{info.icon}</span>
            <span>
              {selectedPOICategory.charAt(0).toUpperCase() +
                selectedPOICategory.slice(1)}
            </span>
          </h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              setSelectedPOICategory(null);
            }}
            className="poi-list-close-button"
          >
            ×
          </button>
        </div>

        <div
          className="poi-list-grid"
          ref={poiListGridRef}
          key={`poi-list-${selectedPOICategory}`}
          onScroll={(e) => {
            poiListScrollPos.current = e.currentTarget.scrollTop;
          }}
        >
          {sortedPOIs.slice(0, 50).map((poi, index) => {
            // Generate a consistent unique ID for comparison
            const poiId = poi.id || `${selectedPOICategory}-${index}`;
            const isSelected =
              selectedPOI?.id === poiId ||
              (selectedPOI?.name === poi.name &&
                selectedPOI?.lat === poi.lat &&
                selectedPOI?.lon === poi.lon);

            return (
              <div
                key={poiId}
                className={`poi-item-card ${isSelected ? "selected" : ""}`}
                onClick={(e) => {
                  // Ensure POI has an ID before passing to handler
                  const poiWithId = { ...poi, id: poiId };
                  handlePOIClick(poiWithId, selectedPOICategory, e);
                }}
              >
                <div className="poi-item-name">
                  {poi.name || poi.tags?.name || "Unnamed"}
                </div>
                {poi.address && (
                  <div className="poi-item-detail">📍 {poi.address}</div>
                )}
                {poi.parkType && (
                  <div className="poi-item-detail">🌳 {poi.parkType}</div>
                )}
                {poi.schoolType && (
                  <div className="poi-item-detail">🎓 {poi.schoolType}</div>
                )}
                {poi.healthcareType && (
                  <div className="poi-item-detail">🏥 {poi.healthcareType}</div>
                )}
                {poi.cuisine && (
                  <div className="poi-item-detail">🍴 {poi.cuisine}</div>
                )}
                {poi.sport && (
                  <div className="poi-item-detail">⚽ {poi.sport}</div>
                )}
                {poi.line && (
                  <div className="poi-item-detail">🚉 {t('neighborhood.line')}: {poi.line}</div>
                )}
                {poi.network && (
                  <div className="poi-item-detail">🚇 {poi.network}</div>
                )}
                {poi.type &&
                  (poi.type === "kindergarten" || poi.type === "childcare") && (
                    <div className="poi-item-detail">
                      🏫{" "}
                      {poi.type === "kindergarten"
                        ? t('neighborhood.kindergarten')
                        : t('neighborhood.childcare')}
                    </div>
                  )}
              </div>
            );
          })}
        </div>

        {currentPOIs.length === 0 && (
          <div className="poi-list-empty">
            {t('neighborhood.noPOIsFound', { category: selectedPOICategory })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="neighborhood-map-container">
      <div className="neighborhood-map-wrapper">
        {onBack && (
          <button onClick={onBack} className="neighborhood-back-button">
            <span className="neighborhood-back-icon">←</span>
            <span>{t('back')}</span>
          </button>
        )}

        <section className="neighborhood-header-section">
          <div className="neighborhood-header-card">
            <div className="neighborhood-header-content">
              <div className="neighborhood-title-group">
                <h1>
                  {getAbbreviatedName(
                    neighborhoodInfo?.name || neighborhoodName
                  )}
                </h1>
                {neighborhoodInfo?.neighborhood && (
                  <p className="neighborhood-subtitle">
                    {neighborhoodInfo.neighborhood}
                  </p>
                )}
              </div>
              {/* {neighborhoodInfo?.averagePrice && (
                <div className="neighborhood-price-badge">
                  {neighborhoodInfo.averagePrice}
                </div>
              )} */}
            </div>
            <p className="neighborhood-description">
              {t('neighborhood.description')}
            </p>
          </div>
        </section>
        {/* Average Prices Section */}
        {(neighborhoodInfo?.singleFamilyPrice ||
          neighborhoodInfo?.condoPrice) && (
          <section className="neighborhood-prices-section">
            <div
              className="neighborhood-section-card"
              style={{ padding: "12px" }}
            >
              <h2
                className="neighborhood-section-title"
                style={{ fontSize: "16px", marginBottom: "10px" }}
              >
                💰 {t('neighborhood.medianPropertyPrices')}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "10px",
                }}
              >
                {neighborhoodInfo?.singleFamilyPrice && (
                  <div
                    onClick={() => openPriceModal("single-family")}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      padding: "12px 10px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      border: "2px solid #FFD700",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        marginBottom: "6px",
                      }}
                    >
                      🏠
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginBottom: "4px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t('neighborhood.singleFamily')}
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "900",
                        color: "#2d3436",
                        marginBottom: "8px",
                      }}
                    >
                      {neighborhoodInfo.singleFamilyPrice}
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", fontSize: "11px" }}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openPriceModal("bungalow");
                        }}
                        style={{
                          flex: 1,
                          padding: "6px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          border: "1px solid #FFD700",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            color: "#666",
                            fontWeight: "600",
                            marginBottom: "2px",
                          }}
                        >
                          {t('neighborhood.bungalow')}
                        </div>
                        {/* <div style={{ fontWeight: "700", color: "#2d3436" }}>
                          $
                          {(Math.random() * 300000 + 400000)
                            .toFixed(0)
                            .substring(0, 3)}
                          k
                        </div> */}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openPriceModal("two-storey");
                        }}
                        style={{
                          flex: 1,
                          padding: "6px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          border: "1px solid #FFD700",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            color: "#666",
                            fontWeight: "600",
                            marginBottom: "2px",
                          }}
                        >
                          {t('neighborhood.twoStorey')}
                        </div>
                        {/* <div style={{ fontWeight: "700", color: "#2d3436" }}>
                          $
                          {(Math.random() * 300000 + 800000)
                            .toFixed(0)
                            .substring(0, 3)}
                          k
                        </div> */}
                      </div>
                    </div>
                  </div>
                )}

                {neighborhoodInfo?.condoPrice && (
                  <div
                    onClick={() => openPriceModal("condo")}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      padding: "12px 10px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      border: "2px solid #FFC700",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        marginBottom: "6px",
                      }}
                    >
                      🏢
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginBottom: "4px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t('neighborhood.condo')}
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "900",
                        color: "#2d3436",
                        marginBottom: "8px",
                      }}
                    >
                      {neighborhoodInfo.condoPrice}
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", fontSize: "11px" }}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openPriceModal("one-bedroom");
                        }}
                        style={{
                          flex: 1,
                          padding: "6px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          border: "1px solid #FFC700",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            color: "#666",
                            fontWeight: "600",
                            marginBottom: "2px",
                          }}
                        >
                          {t('neighborhood.oneBedroom')}
                        </div>
                        {/* <div style={{ fontWeight: "700", color: "#2d3436" }}>
                          $
                          {(Math.random() * 200000 + 250000)
                            .toFixed(0)
                            .substring(0, 3)}
                          k
                        </div> */}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openPriceModal("two-bedroom");
                        }}
                        style={{
                          flex: 1,
                          padding: "6px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          border: "1px solid #FFC700",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            color: "#666",
                            fontWeight: "600",
                            marginBottom: "2px",
                          }}
                        >
                          {t('neighborhood.twoBedroom')}
                        </div>
                        {/* <div style={{ fontWeight: "700", color: "#2d3436" }}>
                          $
                          {(Math.random() * 200000 + 650000)
                            .toFixed(0)
                            .substring(0, 3)}
                          k
                        </div> */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Side-by-side container for Amenities and Map */}
        <div className="neighborhood-content-container">
          {/* Left Side: Amenities */}
          <div className="neighborhood-amenities-map-wrapper">
            <section className="neighborhood-amenities-section">
              <div className="neighborhood-section-card">
                <h2 className="neighborhood-section-title">{t('neighborhood.amenitiesNearby')}</h2>
                <p className="neighborhood-section-description">
                  {t('neighborhood.amenitiesDescription')}
                </p>
                <POICategoryPanel />
                <POIList />
              </div>
            </section>
          </div>

          {/* Right Side: Map */}
          <div className="neighborhood-map-wrapper-side">
            <section className="neighborhood-map-section" ref={mapSectionRef}>
              <div className="neighborhood-map-container-wrapper neighborhood-detail-map">
                <MapContainer
                  center={center}
                  zoom={maxZoom || 14}
                  minZoom={11}
                  maxZoom={28}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                  doubleClickZoom={true}
                  touchZoom={true}
                  boxZoom={true}
                  keyboard={true}
                  zoomAnimation={true}
                  fadeAnimation={true}
                  markerZoomAnimation={true}
                  attributionControl={true}
                  className="neighborhood-leaflet-map"
                  ref={(mapInstance) => {
                    if (mapInstance && !map) {
                      setMap(mapInstance);
                      console.log("✅ Map instance created and stored");

                      // Log center and zoom on zoom change
                      mapInstance.on("zoomend", () => {
                        const zoom = mapInstance.getZoom();
                        const center = mapInstance.getCenter();
                        setCurrentZoom(zoom);
                        console.log("📍 Neighborhood Center:", {
                          lat: center.lat.toFixed(6),
                          lng: center.lng.toFixed(6),
                        });
                        console.log("🔍 Zoom:", zoom.toFixed(2));
                      });
                    }
                  }}
                >
                  {/* Base Layer: Real map from OpenStreetMap */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />

                  {/* Dimmed overlay for everything outside the neighborhood */}
                  {inverseMaskGeoJSON && (
                    <GeoJSON
                      data={inverseMaskGeoJSON}
                      style={getInverseMaskStyle}
                    />
                  )}

                  {/* Overlay: Neighborhood outline only (using original unrotated GeoJSON) */}
                  {originalGeoJSON && (
                    <GeoJSON
                      data={originalGeoJSON}
                      style={getNeighborhoodOutlineStyle}
                      onEachFeature={onEachFeature}
                    />
                  )}

                  {/* Marker for selected POI */}
                  {selectedPOI && selectedPOI.lat && selectedPOI.lon && (
                    <Marker
                      position={[selectedPOI.lat, selectedPOI.lon]}
                      icon={createPOIIcon(selectedPOI.category)}
                    >
                      <Popup>
                        <div style={{ padding: "8px" }}>
                          <h3
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: "16px",
                              fontWeight: "700",
                            }}
                          >
                            {selectedPOI.name ||
                              selectedPOI.tags?.name ||
                              "Unnamed"}
                          </h3>
                          {selectedPOI.address && (
                            <p style={{ margin: "4px 0", fontSize: "13px" }}>
                              📍 {selectedPOI.address}
                            </p>
                          )}
                          {selectedPOI.cuisine && (
                            <p style={{ margin: "4px 0", fontSize: "13px" }}>
                              🍴 {selectedPOI.cuisine}
                            </p>
                          )}
                          {selectedPOI.sport && (
                            <p style={{ margin: "4px 0", fontSize: "13px" }}>
                              ⚽ {selectedPOI.sport}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </section>
          </div>
        </div>

        <section className="neighborhood-walkability-section">
          <div
            className="neighborhood-section-card"
            style={{ padding: "16px" }}
          >
            <h2
              className="neighborhood-section-title"
              style={{ fontSize: "18px", marginBottom: "8px" }}
            >
              {t('neighborhood.walkabilityMobilityScores')}
            </h2>
            <WalkabilityScoresBadge
              walkabilityScores={walkabilityScores}
              enhancedScores={enhancedScores}
            />
          </div>
        </section>

        {/* <NeighborhoodFooter neighborhoodName={neighborhoodName} /> */}
      </div>
      <PriceRequestModal
        isOpen={modalState.isOpen}
        onClose={closePriceModal}
        type={modalState.type}
      />
    </div>
  );
};

export default NeighborhoodMap;
