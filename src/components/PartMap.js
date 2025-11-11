import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, GeoJSON, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import "./PremiumEffects.css";
import "./PartMap.css";
import { rotateGeoJSON } from "./Utils";
import MontrealMapImage from "../data/Montreal-map.png";
import MontrealSvg from "./MontrealSvg";
import ProfessionalHeader from "./ProfessionalHeader";

// Premium colors for each part - Luxurious palette
const getColorByPart = (part) => {
  const colorMap = {
    North: "#8B5CF6", // Royal Purple
    South: "#F59E0B", // Rich Amber
    East: "#10B981", // Emerald Green
    West: "#3B82F6", // Sapphire Blue
    Central: "#10B981", // Emerald Green
  };
  return colorMap[part] || "#8B5CF6";
};

// Get display name for each part
const getPartDisplayName = (part) => {
  const nameMap = {
    South: "Downtown/ Center South",
    West: "West Island",
    North: "Montreal East/ North",
    Central: "Central North",
  };
  return nameMap[part] || part;
};

// Yellow color variations inspired by Boomsold branding
const getYellowShadeByPart = (part) => {
  return "#FFD700";
};

// Function to aggregate neighborhoods by part and merge geometries
const aggregateByPart = (geoJsonData) => {
  const partMap = {
    North: { features: [], color: getYellowShadeByPart("North") },
    South: { features: [], color: getYellowShadeByPart("South") },
    East: { features: [], color: getYellowShadeByPart("East") },
    West: { features: [], color: getYellowShadeByPart("West") },
    Central: { features: [], color: getYellowShadeByPart("Central") },
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Detect mobile device

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset hover states on component mount
  useEffect(() => {
    // Ensure clean state when component mounts
    setHoveredPartName(null);
    setHoveredPart(null);
  }, []);

  // Cleanup hover states when component unmounts
  useEffect(() => {
    return () => {
      // Reset hover states when component is unmounted
      setHoveredPartName(null);
      setHoveredPart(null);

      // Call onPartLeave to clean up parent component state
      if (onPartLeave) {
        onPartLeave();
      }
    };
  }, [onPartLeave]); // Load and aggregate GeoJSON data by part
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

        // Rotate for visual appeal ONLY ON DESKTOP
        const centerPoint = { lat: 45.48, lng: -73.62 };
        const rotatedData = isMobile
          ? rotateGeoJSON(aggregated, 0, centerPoint, 1.3, 1.8) // Mobile: compress X axis (1.2), stretch Y axis (1.8)
          : rotateGeoJSON(aggregated, 335, centerPoint, 1.3, 1.3); // Rotate on desktop

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
  }, [isMobile]);

  // Style function for parts - Yellow variations with no visible borders, shadows provide separation
  const getPartStyle = (feature) => {
    const partColor = feature.properties.color || "#FFD700";
    return {
      fillColor: partColor,
      weight: 0, // No borders at all
      opacity: 0, // No border opacity
      color: "transparent", // Transparent borders
      fillOpacity: 0.9,
      lineJoin: "round",
      lineCap: "round",
    };
  };

  // Hover style - Brighter version with no borders, only shadow effects
  const getPartHoverStyle = (feature) => {
    const partColor = feature.properties.color || "#FFD700";
    // Make hover color lighter/brighter with no borders
    return {
      weight: 0, // No borders on hover either
      color: "white", // Transparent borders on hover
      fillOpacity: 1,
      opacity: 0, // No border opacity on hover
      fillColor: partColor,
      lineJoin: "round",
      lineCap: "round",
    };
  };

  // Handle part interactions
  const onEachPart = (feature, layer) => {
    const originalStyle = getPartStyle(feature);

    // Mouse over - highlight
    layer.on({
      mouseover: () => {
        layer.setStyle(getPartHoverStyle(feature));
        layer.bringToFront();

        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, -3px)";
          pathElement.style.transition = "none";
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
          pathElement.style.transition = "none";
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

        // Reset hover states before navigation
        setHoveredPartName(null);
        setHoveredPart(null);

        // Reset any lingering hover styles
        layer.setStyle(originalStyle);
        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, 0)";
          pathElement.style.transition = "none";
          pathElement.style.zIndex = "auto";
        }

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
        ); // Same rotation for both mobile and desktop

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
    <div className="part-map-container">
      {/* BoomSold Logo - Top Right */}
      <div
        style={{
          position: "fixed",
          top: isMobile ? "2%" : "5%",
          right: isMobile ? "10px" : "20px",
          width: isMobile ? "100px" : "150px",
          height: isMobile ? "65px" : "100px",
          zIndex: 1000,
        }}
      >
        <img
          src={
            process.env.PUBLIC_URL +
            "/assets/BOOM SOLD LOGO 2025 YELLOW PNG SMALL.png"
          }
          alt="Boom Sold Logo"
          className="boomsold-logo"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Info Bubble - Bottom Right */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: "10%",
            right: "5%",
            width: "320px",
            height: "auto",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#FFD700",
              color: "#000000",
              padding: "20px 24px",
              borderRadius: "20px",
              boxShadow:
                "0 4px 20px rgba(255, 215, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              lineHeight: "1.6",
              textAlign: "center",
              border: "2px solid rgba(0, 0, 0, 0.1)",
              boxSizing: "border-box",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>
              We are here to simplify your real estate search. Select a
              neighborhood to discover average home prices, amenities nearby and
              more.
            </p>
          </div>
        </div>
      )}

      {/* Montreal Island Header */}
      <h2
        className="selected-part-label"
        style={{
          fontSize: isMobile ? "1.2rem" : undefined,
          top: isMobile ? "8%" : undefined,
        }}
      >
        Welcome to Montreal
      </h2>

      {/* Top Heading */}
      <h2
        className="part-map-heading"
        style={{
          position: "fixed",
          top: isMobile ? "10%" : "15%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          fontSize: isMobile ? "1.2rem" : "1.8rem",
          fontWeight: 300,
          color: "#2d3436",
          textAlign: "center",
          margin: 0,
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          pointerEvents: "none",
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        Select a part of the city
      </h2>

      {/* Side Legend */}

      {/* Hovered Part Name - Above the Map */}
      {/* {hoveredPartName && (
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
      )} */}

      <div
        className="custom-montreal-map"
        style={{ background: "transparent" }}
      >
        {isMobile ? (
          // Mobile view - Static image
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={MontrealMapImage}
              alt="Montreal Map"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ) : (
          // Desktop view - Interactive map
          <MapContainer
            center={[45.56, -73.62]}
            zoom={10.8}
            style={{ height: "100%", width: "100%", background: "transparent" }}
            zoomControl={false}
            boxZoom={false}
            keyboard={false}
            zoomAnimation={true}
            fadeAnimation={true}
            markerZoomAnimation={false}
            attributionControl={false}
            preferCanvas={false}
            maxBounds={null}
            maxBoundsViscosity={0.0}
            whenCreated={(mapInstance) => {
              setMap(mapInstance);
              // Remove any default tile layers
              mapInstance.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                  mapInstance.removeLayer(layer);
                }
              });

              // Disable all zoom and pan interactions on desktop
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
              // Only show South, West, and North on desktop
              if (!["South", "West", "North", "Central"].includes(partName))
                return null;

              const displayName = getPartDisplayName(partName);

              // Adjust positions for each part
              let adjustedLat = center.lat;
              let adjustedLng = center.lng;

              if (partName === "North") {
                // Move North up and left
                adjustedLat += 0.03; // Move up
                adjustedLng -= 0.08; // Move left (increased from 0.05)
              } else if (partName === "South") {
                // Move South left
                adjustedLng -= 0.07; // Move left
              } else if (partName === "Central") {
                // Move West Island down and left
                adjustedLat += 0.02; // Move down
                adjustedLng -= 0.09; // Move left
              } else if (partName === "West") {
                // Move West Island down and left
                adjustedLat += 0.02; // Move down
                adjustedLng -= 0.05; // Move left
              }

              // Create custom icon with styled text matching MontrealMap
              const textIcon = L.divIcon({
                className: "part-label-icon",
                html: `
                <div style="
                  color: #000000;
                  font-size: 14px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
                  text-shadow: 
                    0 0 8px rgba(255, 215, 0, 0.9),
                    0 0 12px rgba(255, 215, 0, 0.8),
                    1px 1px 2px rgba(0, 0, 0, 0.3);
                  white-space: nowrap;
                  pointer-events: none;
                  font-family: 'Nunito', sans-serif;
                  transform: translate(-50%, -50%);
                  background: transparent;
                  padding: 4px 8px;
                  border-radius: 6px;
                  text-align: center;
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
        )}
      </div>

      {/* Mobile Bottom Navigation for Parts */}
      {isMobile && (
        <div className="mobile-parts-nav">
          {["South", "West", "North", "Central"].map((partName) => {
            const feature = partData?.features.find(
              (f) => f.properties.part === partName
            );

            if (!feature) return null;

            return (
              <button
                key={partName}
                className="part-nav-button"
                onClick={() => {
                  // Simulate the click event
                  const partFeature = feature;

                  // Get bounds of this part
                  let allCoords = [];
                  if (partFeature.geometry.type === "MultiPolygon") {
                    partFeature.geometry.coordinates.forEach((poly) => {
                      poly.forEach((ring) => {
                        allCoords = allCoords.concat(ring);
                      });
                    });
                  } else if (partFeature.geometry.type === "Polygon") {
                    partFeature.geometry.coordinates.forEach((ring) => {
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
                  ); // Same rotation for both mobile and desktop

                  // Trigger callback with part name and filtered GeoJSON
                  if (onPartClick) {
                    onPartClick({
                      partName: partName,
                      geoJSON: rotatedPartData,
                    });
                  }
                }}
              >
                {getPartDisplayName(partName)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartMap;
