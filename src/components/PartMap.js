import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, GeoJSON, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import "./PremiumEffects.css";
import { rotateGeoJSON } from "./Utils";
import MontrealSvg from "./MontrealSvg";
import ProfessionalHeader from "./ProfessionalHeader";

// Premium colors for each part - Luxurious palette
const getColorByPart = (part) => {
  const colorMap = {
    North: "#8B5CF6", // Royal Purple
    South: "#F59E0B", // Rich Amber
    East: "#10B981", // Emerald Green
    West: "#3B82F6", // Sapphire Blue
  };
  return colorMap[part] || "#8B5CF6";
};

// Get display name for each part
const getPartDisplayName = (part) => {
  const nameMap = {
    South: "City Center/ South of the island",
    West: "West Island",
    North: "Montreal North",
  };
  return nameMap[part] || part;
};

// Function to aggregate neighborhoods by part and merge geometries
const aggregateByPart = (geoJsonData) => {
  const partMap = {
    North: { features: [], color: "#8B5CF6" },
    South: { features: [], color: "#F59E0B" },
    East: { features: [], color: "#10B981" },
    West: { features: [], color: "#3B82F6" },
  };

  // Group features by part
  geoJsonData.features.forEach((feature) => {
    const part = feature.properties.part;
    if (partMap[part]) {
      partMap[part].features.push(feature);
    }
  });

  // Create aggregated GeoJSON with one feature per part
  const aggregatedFeatures = Object.entries(partMap).map(([part, data]) => {
    // Merge all coordinates from all features in this part
    const allCoordinates = [];
    const geometryType = data.features[0]?.geometry?.type || "MultiPolygon";

    data.features.forEach((feature) => {
      if (feature.geometry && feature.geometry.coordinates) {
        if (geometryType === "MultiPolygon") {
          allCoordinates.push(...feature.geometry.coordinates);
        } else if (geometryType === "Polygon") {
          allCoordinates.push(...feature.geometry.coordinates);
        }
      }
    });

    return {
      type: "Feature",
      properties: {
        part: part,
        color: data.color,
        name: part,
        value: part.substring(0, 1),
        type: "part",
        count: data.features.length,
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: allCoordinates,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features: aggregatedFeatures.filter(
      (f) => f.geometry.coordinates.length > 0
    ),
  };
};

const PartMap = ({ onPartClick, onPartHover, onPartLeave }) => {
  const [partData, setPartData] = useState(null);
  const [fullGeoJsonData, setFullGeoJsonData] = useState(null); // Store original full data
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [hoveredPartName, setHoveredPartName] = useState(null);
  const [hoveredPart, setHoveredPart] = useState(null); // Track which part is hovered
  const geoJsonLayerRef = useRef(null);
  const [partCenters, setPartCenters] = useState({}); // Store center coordinates for each part

  // Load and aggregate GeoJSON data by part
  useEffect(() => {
    fetch(
      process.env.PUBLIC_URL + "/quartierreferencehabitation_merged.geojson"
    )
      .then((response) => response.json())
      .then((geoJsonData) => {
        // Store the full original data
        setFullGeoJsonData(geoJsonData);

        // Aggregate by part
        const aggregated = aggregateByPart(geoJsonData);

        // Rotate for visual appeal
        const centerPoint = { lat: 45.48, lng: -73.62 };
        const rotatedData = rotateGeoJSON(
          aggregated,
          335,
          centerPoint,
          1.3,
          1.3
        );

        // Calculate centers for each part
        const centers = {};
        rotatedData.features.forEach((feature) => {
          const partName = feature.properties.part;
          // Calculate centroid of the part
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
          centers[partName] = {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          };
        });

        setPartCenters(centers);
        setPartData(rotatedData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading part data:", error);
        setIsLoading(false);
      });
  }, []);

  // Fit map to bounds when data loads or window resizes
  useEffect(() => {
    if (map && partData) {
      const fitMapBounds = () => {
        const bounds = L.geoJSON(partData).getBounds();
        map.fitBounds(bounds, {
          padding: [20, 20],
          animate: false,
          maxZoom: 10.8,
        });
      };

      fitMapBounds();

      // Fit bounds on window resize
      window.addEventListener("resize", fitMapBounds);
      return () => window.removeEventListener("resize", fitMapBounds);
    }
  }, [map, partData]);

  // Style function for parts - NO BORDERS
  const getPartStyle = (feature) => {
    return {
      fillColor: feature.properties.color || "#4DD0E1",
      weight: 0, // NO BORDER
      opacity: 0,
      color: "transparent", // Transparent border
      fillOpacity: 0.85,
      lineJoin: "round",
      lineCap: "round",
    };
  };

  // Hover style - still no borders, just opacity change
  const getPartHoverStyle = () => ({
    weight: 0, // NO BORDER
    color: "transparent",
    fillOpacity: 0.95,
    opacity: 0,
    lineJoin: "round",
    lineCap: "round",
  });

  // Handle part interactions
  const onEachPart = (feature, layer) => {
    const originalStyle = getPartStyle(feature);

    // Mouse over - highlight
    layer.on({
      mouseover: () => {
        layer.setStyle(getPartHoverStyle());
        layer.bringToFront();

        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, -3px)";
          pathElement.style.filter =
            "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3))";
          pathElement.style.transition = "all 0.2s ease-out";
          pathElement.style.zIndex = "1000";
        }

        // Show part name above map and set hovered part for legend
        setHoveredPartName(feature.properties.part);
        setHoveredPart(feature.properties.part);

        if (onPartHover) {
          onPartHover({
            part: feature.properties.part,
            count: feature.properties.count,
            color: feature.properties.color,
          });
        }
      },
      mouseout: () => {
        layer.setStyle(originalStyle);

        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, 0)";
          pathElement.style.filter = "none";
          pathElement.style.transition = "all 0.2s ease-out";
          pathElement.style.zIndex = "auto";
        }

        // Hide part name above map and clear hovered part
        setHoveredPartName(null);
        setHoveredPart(null);

        if (onPartLeave) {
          onPartLeave();
        }
      },
      click: () => {
        console.log(`Clicked on ${feature.properties.part}`);

        // Get bounds of this part
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

        if (map) {
          map.fitBounds(bounds, { maxZoom: 13, padding: [50, 50] });
        }

        // Filter GeoJSON for this part and rotate it
        const partName = feature.properties.part;
        const filteredData = {
          ...fullGeoJsonData,
          features: fullGeoJsonData.features.filter(
            (f) => f.properties.part === partName
          ),
        };

        // Rotate the filtered GeoJSON for this part
        const centerPoint = { lat: 45.48, lng: -73.62 };
        const rotatedPartData = rotateGeoJSON(
          filteredData,
          335,
          centerPoint,
          1.2,
          1
        );

        // Trigger callback with part name and filtered GeoJSON
        if (onPartClick) {
          onPartClick({
            partName: partName,
            geoJSON: rotatedPartData,
          });
        }
      },
    });
  };

  if (isLoading) {
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
          Loading Montreal Parts Map...
        </div>
      </div>
    );
  }

  return (
    <div className="montreal-map-container">
      {/* Top Heading */}
      <h1
        style={{
          position: "fixed",
          top: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "#2d3436",
          textAlign: "center",
          margin: 0,
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          pointerEvents: "none",
        }}
      >
        Select a part of the city
      </h1>

      {/* Side Legend */}
      <div
        style={{
          position: "fixed",
          right: 40,
          bottom: 150,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          zIndex: 1000,
          minWidth: "180px",
        }}
      >
        <h3
          style={{
            margin: "0 0 15px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#333",
          }}
        >
          Montreal
          {/* <MontrealSvg /> */}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transform: hoveredPart === "South" ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#F59E0B",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>
              City Center/ South
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transform: hoveredPart === "West" ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#3B82F6",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>West Island</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transform: hoveredPart === "North" ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#8B5CF6",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>
              Montreal North
            </span>
          </div>
        </div>

        <p
          style={{
            margin: "15px 0 0 0",
            fontSize: "12px",
            color: "#666",
            fontStyle: "italic",
          }}
        >
          Click a region to explore
        </p>
      </div>

      {/* Hovered Part Name - Above the Map */}
      {hoveredPartName && (
        <h2
          style={{
            position: "fixed",
            width: "90%",
            top: "7.5%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            fontSize: "4rem",
            fontWeight: 900,
            color: getColorByPart(hoveredPartName),
            textTransform: "uppercase",
            letterSpacing: "8px",
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif",
            textShadow: `
              5px 5px 0px #000000,
              -3px -3px 0px #000000,
              3px -3px 0px #000000,
              -3px 3px 0px #000000,
              0 0 30px ${getColorByPart(hoveredPartName) + "4a"},
              0 0 50px ${getColorByPart(hoveredPartName) + "2e"},
              0 0 70px ${getColorByPart(hoveredPartName) + "1a"},
              0 0 100px ${getColorByPart(hoveredPartName) + "0d"}
            `,

            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {getPartDisplayName(hoveredPartName)}
        </h2>
      )}

      <div
        className="custom-montreal-map"
        style={{ background: "transparent" }}
      >
        <MapContainer
          center={[45.56, -73.62]}
          zoom={10.8}
          style={{ height: "100%", width: "100%", background: "transparent" }}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          dragging={false}
          zoomAnimation={false}
          fadeAnimation={false}
          markerZoomAnimation={false}
          attributionControl={false}
          preferCanvas={false}
          whenCreated={(mapInstance) => {
            setMap(mapInstance);
            // Remove any default tile layers
            mapInstance.eachLayer((layer) => {
              if (layer instanceof L.TileLayer) {
                mapInstance.removeLayer(layer);
              }
            });

            // Disable all zoom and pan interactions
            mapInstance.dragging.disable();
            mapInstance.touchZoom.disable();
            mapInstance.doubleClickZoom.disable();
            mapInstance.scrollWheelZoom.disable();
            mapInstance.boxZoom.disable();
            mapInstance.keyboard.disable();
            if (mapInstance.tap) mapInstance.tap.disable();

            // Fit to bounds when data is loaded
            if (partData) {
              const bounds = L.geoJSON(partData).getBounds();
              mapInstance.fitBounds(bounds, {
                padding: [20, 20],
                animate: false,
                maxZoom: 10.8,
              });
            }
          }}
        >
          {partData && (
            <GeoJSON
              data={partData}
              style={getPartStyle}
              onEachFeature={onEachPart}
              ref={geoJsonLayerRef}
            />
          )}

          {/* Add text labels for each part */}

          {Object.entries(partCenters).map(([partName, center]) => {
            // Only show South, West, and North
            if (!["South", "West", "North"].includes(partName)) return null;

            const displayName = getPartDisplayName(partName);

            // Adjust positions for each part
            let adjustedLat = center.lat;
            let adjustedLng = center.lng;

            if (partName === "North") {
              // Move North up and left
              adjustedLat += 0.03; // Move up
              adjustedLng -= 0.05; // Move left
            } else if (partName === "South") {
              // Move South left
              adjustedLng -= 0.07; // Move left
            }

            // Create custom icon with white text
            const textIcon = L.divIcon({
              className: "part-label-icon",
              html: `
                <div style="
                  color: white;
                  font-size: 12px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                  text-shadow: 
                    2px 2px 4px rgba(0,0,0,0.8),
                    -1px -1px 2px rgba(0,0,0,0.8),
                    1px -1px 2px rgba(0,0,0,0.8),
                    -1px 1px 2px rgba(0,0,0,0.8);
                  white-space: nowrap;
                  pointer-events: none;
                  font-family: 'Arial', sans-serif;
                  transform: translate(-50%, -50%);
                ">
                  ${displayName}
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });

            return (
              <Marker
                key={partName}
                position={[adjustedLat, adjustedLng]}
                icon={textIcon}
                interactive={false}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default PartMap;
