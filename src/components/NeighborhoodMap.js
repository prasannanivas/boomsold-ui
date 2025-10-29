import React, { useState, useEffect } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
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

  // Get walkability scores for the neighborhood
  const neighborhoodName =
    neighborhoodInfo?.name ||
    neighborhoodGeoJSON?.features?.[0]?.properties?.name ||
    neighborhoodGeoJSON?.features?.[0]?.properties?.nom_arr;
  const walkabilityScores = getNeighborhoodScores(neighborhoodName);

  // Get enhanced scores (transit and bike details)
  const enhancedScores = enhancedWalkScores[neighborhoodName] || null;

  // Calculate area of a polygon using shoelace formula
  const calculatePolygonArea = (coords) => {
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    return Math.abs(area / 2);
  };

  // Calculate total area of the neighborhood
  const calculateNeighborhoodArea = (feature) => {
    let totalArea = 0;

    if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((poly) => {
        poly.forEach((ring) => {
          totalArea += calculatePolygonArea(ring);
        });
      });
    } else if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates.forEach((ring) => {
        totalArea += calculatePolygonArea(ring);
      });
    }

    return totalArea;
  };

  // Calculate appropriate zoom level based on area
  const calculateZoomLevel = (area) => {
    // Area thresholds (in square degrees, approximate)
    // These values are tuned for Montreal neighborhoods
    if (area > 0.05) return 10; // Very large (RDP, Île-Bizard)
    if (area > 0.03) return 11; // Large (St-Laurent, Ahuntsic)
    if (area > 0.015) return 12; // Medium-large
    if (area > 0.008) return 13; // Medium
    if (area > 0.004) return 13; // Small
    return 13; // Very small (Westmount, Hampstead)
  };

  // Calculate center and bounds from GeoJSON
  const getNeighborhoodBounds = () => {
    if (
      !neighborhoodGeoJSON ||
      !neighborhoodGeoJSON.features ||
      !neighborhoodGeoJSON.features.length
    ) {
      return { center: [45.56, -73.62], bounds: null, maxZoom: 14 };
    }

    const feature = neighborhoodGeoJSON.features[0];
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
        6
      )}, Max Zoom: ${maxZoom}`
    );

    return { center: [centerLat, centerLng], bounds, maxZoom };
  };

  const { center, bounds, maxZoom } = getNeighborhoodBounds();

  // Yellow Glowing style like BoomSold Logo
  const getNeighborhoodStyle = () => ({
    fillColor: "#FFD700", // Bright gold yellow like logo burst
    weight: 4, // Bold black borders
    opacity: 1,
    color: "#000000", // Black borders
    fillOpacity: 0.9,
    lineJoin: "round",
    lineCap: "round",
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

  // Fit bounds when map is created (optional - for fine-tuning)
  useEffect(() => {
    if (map && bounds) {
      setTimeout(() => {
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: false,
        });
      }, 100);
    }
  }, [map, bounds]);

  if (!neighborhoodGeoJSON) {
    return (
      <div className="custom-montreal-map">
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
          Loading Neighborhood...
        </div>
      </div>
    );
  }

  return (
    <div
      className="montreal-map-container"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "fixed",
            top: "10%",
            left: "5%",
            zIndex: 1000,
            padding: "12px 24px",
            backgroundColor: "#FFD700",
            color: "#000000ff",
            border: "2px solid #2a2924ff",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 900,
            cursor: "pointer",

            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Arial Black', 'Arial Bold', 'Helvetica', sans-serif",
          }}
        >
          <span style={{ fontSize: "20px" }}>←</span>
          <span>Back to All Neighborhoods</span>
        </button>
      )}

      {/* Neighborhood Info Badge */}
      {neighborhoodInfo && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            padding: "16px 24px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            width: "320px",
            maxWidth: "calc(100vw - 40px)",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            {getAbbreviatedName(neighborhoodInfo.name)}
          </h3>
          {neighborhoodInfo.neighborhood && (
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              {neighborhoodInfo.neighborhood}
            </p>
          )}
          {neighborhoodInfo.averagePrice && (
            <p
              style={{
                margin: "8px 0 4px 0",
                fontSize: "16px",
                fontWeight: 600,
                color: "#4ECDC4",
              }}
            >
              {neighborhoodInfo.averagePrice}
            </p>
          )}

          {/* Walkability Scores Section */}
          <WalkabilityScoresBadge
            walkabilityScores={walkabilityScores}
            enhancedScores={enhancedScores}
          />
        </div>
      )}

      <div
        className="custom-montreal-map"
        style={{ background: "", height: "100vh", flexShrink: 0 }}
      >
        <MapContainer
          center={center}
          zoom={maxZoom || 14}
          minZoom={11}
          maxZoom={18}
          style={{ height: "100%", width: "100%", background: "transparent" }}
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
          whenCreated={(mapInstance) => {
            setMap(mapInstance);

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
          }}
        >
          {/* GeoJSON: Only selected neighborhood */}
          <GeoJSON
            data={neighborhoodGeoJSON}
            style={getNeighborhoodStyle}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      </div>

      {/* Footer Section */}
      <NeighborhoodFooter neighborhoodName={neighborhoodName} />
    </div>
  );
};

export default NeighborhoodMap;
