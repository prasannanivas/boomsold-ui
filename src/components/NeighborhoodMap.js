import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import "./NeighborhoodMap.css";
import "./PremiumEffects.css";
import { getNeighborhoodScores } from "../utils/walkabilityScores";
import enhancedWalkScores from "../data/enhancedWalkScores.json";
import WalkabilityScoresBadge from "./WalkabilityScoresBadge";
import NeighborhoodFooter from "./NeighborhoodFooter";

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
  "Mercier–Hochelaga-Maisonneuve": "Hochelag",
  "Mercier-Hochelaga-Maisonneuve": "Hochelag",
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
  const [map, setMap] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [selectedPOICategory, setSelectedPOICategory] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null); // Track clicked POI
  const [originalGeoJSON, setOriginalGeoJSON] = useState(null); // Store original unrotated GeoJSON
  const mapSectionRef = useRef(null); // Reference to map section for scrolling
  const [poiCategories, setPOICategories] = useState({
    parks: [],
    schools: [],
    hospitals: [],
    restaurants: [],
    sports: [],
  });

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
    };

    return L.divIcon({
      className: "custom-poi-marker",
      html: `<div style="font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconMap[category]}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  };

  // Handle POI click - scroll to map and mark location
  const handlePOIClick = (poi, category) => {
    console.log("🎯 POI Clicked:", poi.name, "Category:", category);
    console.log("🗺️ Map instance:", map);
    console.log("📍 POI Coordinates:", poi.lat, poi.lon);
    console.log("📜 Map section ref:", mapSectionRef.current);

    if (!map || !poi.lat || !poi.lon) {
      console.warn("❌ Cannot navigate - missing map or coordinates");
      return;
    }

    // Set the selected POI
    setSelectedPOI({ ...poi, category });

    // Scroll to map section first
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    // Just pan to POI location smoothly without changing zoom
    // This keeps the neighborhood in view
    setTimeout(() => {
      map.panTo([poi.lat, poi.lon], {
        animate: true,
        duration: 1.0,
      });
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

        setPOICategories({
          parks,
          schools,
          hospitals,
          restaurants,
          sports,
        });

        console.log(
          "✅ POIs filtered (STRICT polygon containment) for neighborhood:",
          {
            parks: parks.length,
            schools: schools.length,
            hospitals: hospitals.length,
            restaurants: restaurants.length,
            sports: sports.length,
            total:
              parks.length +
              schools.length +
              hospitals.length +
              restaurants.length +
              sports.length,
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

  // Fit bounds when map is created and originalGeoJSON is loaded
  useEffect(() => {
    if (map && bounds && originalGeoJSON) {
      setTimeout(() => {
        console.log("🎯 Fitting map to neighborhood bounds:", bounds);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 0.5,
        });
      }, 200);
    }
  }, [map, bounds, originalGeoJSON]);

  if (!neighborhoodGeoJSON) {
    return (
      <div className="custom-montreal-map">
        <div className="neighborhood-loading">Loading Neighborhood...</div>
      </div>
    );
  }

  // POI Category Panel Component
  const POICategoryPanel = () => {
    const categories = [
      {
        id: "parks",
        name: "Parks",
        icon: "🌳",
        color: "#4CAF50",
        count: poiCategories.parks.length,
      },
      {
        id: "schools",
        name: "Schools",
        icon: "🎓",
        color: "#2196F3",
        count: poiCategories.schools.length,
      },
      {
        id: "hospitals",
        name: "Hospitals",
        icon: "🏥",
        color: "#F44336",
        count: poiCategories.hospitals.length,
      },
      {
        id: "restaurants",
        name: "Restaurants",
        icon: "🍽️",
        color: "#FF9800",
        count: poiCategories.restaurants.length,
      },
      {
        id: "sports",
        name: "Sports",
        icon: "🏟️",
        color: "#9C27B0",
        count: poiCategories.sports.length,
      },
    ];

    return (
      <div>
        <div className="poi-category-panel">
          {categories.map((cat) => (
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

        <div className="poi-list-grid">
          {sortedPOIs.slice(0, 50).map((poi, index) => (
            <div
              key={`${poi.id}-${index}`}
              className={`poi-item-card ${
                selectedPOI?.id === poi.id ? "selected" : ""
              }`}
              onClick={() => handlePOIClick(poi, selectedPOICategory)}
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
            </div>
          ))}
        </div>

        {currentPOIs.length > 50 && (
          <div className="poi-list-footer">
            Showing first 50 of {currentPOIs.length} items
          </div>
        )}
        {currentPOIs.length === 0 && (
          <div className="poi-list-empty">
            No {selectedPOICategory} found in this neighborhood
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
            <span>Back to All Neighborhoods</span>
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
              {neighborhoodInfo?.averagePrice && (
                <div className="neighborhood-price-badge">
                  {neighborhoodInfo.averagePrice}
                </div>
              )}
            </div>
            <p className="neighborhood-description">
              Explore the neighborhood outline, mobility scores, and nearby
              amenities tailored for home hunters.
            </p>
          </div>
        </section>
        {/* Average Prices Section */}
        {(neighborhoodInfo?.singleFamilyPrice ||
          neighborhoodInfo?.condoPrice) && (
          <section className="neighborhood-prices-section">
            <div
              className="neighborhood-section-card"
              style={{ padding: "16px" }}
            >
              <h2
                className="neighborhood-section-title"
                style={{ fontSize: "18px", marginBottom: "8px" }}
              >
                💰 Average Property Prices
              </h2>

              <div
                style={{
                  marginTop: "12px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {neighborhoodInfo?.singleFamilyPrice && (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      padding: "16px 12px",
                      textAlign: "center",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      border: "2px solid #FFD700",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "32px",
                        marginBottom: "8px",
                      }}
                    >
                      🏠
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginBottom: "6px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Single Family Home
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "900",
                        color: "#2d3436",
                      }}
                    >
                      {neighborhoodInfo.singleFamilyPrice}
                    </div>
                  </div>
                )}

                {neighborhoodInfo?.condoPrice && (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      padding: "16px 12px",
                      textAlign: "center",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      border: "2px solid #4ECDC4",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "32px",
                        marginBottom: "8px",
                      }}
                    >
                      🏢
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginBottom: "6px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Condo Price
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "900",
                        color: "#2d3436",
                      }}
                    >
                      {neighborhoodInfo.condoPrice}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="neighborhood-map-section" ref={mapSectionRef}>
          <div className="neighborhood-map-container-wrapper neighborhood-detail-map">
            <MapContainer
              center={center}
              zoom={maxZoom || 14}
              minZoom={11}
              maxZoom={18}
              style={{ height: "50vh", minHeight: "350px", width: "100%" }}
              zoomControl={true}
              scrollWheelZoom={false}
              doubleClickZoom={true}
              touchZoom={true}
              boxZoom={true}
              keyboard={true}
              zoomAnimation={true}
              fadeAnimation={true}
              markerZoomAnimation={true}
              attributionControl={false}
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

        <section className="neighborhood-walkability-section">
          <div
            className="neighborhood-section-card"
            style={{ padding: "16px" }}
          >
            <h2
              className="neighborhood-section-title"
              style={{ fontSize: "18px", marginBottom: "8px" }}
            >
              Walkability & Mobility Scores
            </h2>
            <WalkabilityScoresBadge
              walkabilityScores={walkabilityScores}
              enhancedScores={enhancedScores}
            />
          </div>
        </section>

        <section className="neighborhood-amenities-section">
          <div className="neighborhood-section-card">
            <h2 className="neighborhood-section-title">Amenities Nearby</h2>
            <p className="neighborhood-section-description">
              Select a category to see highlighted points of interest within the
              neighborhood outline.
            </p>
            <POICategoryPanel />
            <POIList />
          </div>
        </section>

        {/* <NeighborhoodFooter neighborhoodName={neighborhoodName} /> */}
      </div>
    </div>
  );
};

export default NeighborhoodMap;
