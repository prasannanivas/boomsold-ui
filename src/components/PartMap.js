import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, GeoJSON, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import "./PremiumEffects.css";
import "./PartMap.css";
import { rotateGeoJSON } from "./Utils";
import MontrealMapImage from "../data/Montreal-map-textremoved.png";
import MontrealSvg from "./MontrealSvg";
import ProfessionalHeader from "./ProfessionalHeader";

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
    coordinates: [45.519164, -73.534403],
    icon: "🎡",
    description: "Old Port - Ferris Wheel",
    color: "#FF6B6B",
  },
];

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
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
              border: 0;
              border-radius: 50%;
            "
          />
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -11],
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
      map.setZoom(zoomLevel, { animate: false });
    }
  }, [map, zoomLevel]);

  return null;
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
  const [zoomLevel, setZoomLevel] = useState(10.8); // Dynamic zoom level
  const mobileMapImageRef = useRef(null); // Ref for mobile map image
  const [arrowPositions, setArrowPositions] = useState(null); // Store calculated arrow positions
  const [showArrows, setShowArrows] = useState(false); // Control arrow visibility
  const [iconicLocations, setIconicLocations] = useState([]); // Store rotated iconic locations
  const [showInfoBox, setShowInfoBox] = useState(true); // Control info box visibility

  // Calculate responsive font size for mobile buttons
  const calculateButtonFontSize = useCallback(() => {
    const width = window.innerWidth;
    // Base font size: 9.5px for 375px width (typical mobile) - made smaller
    // Scale proportionally with screen width
    const baseFontSize = 9.5;
    const baseWidth = 375;
    const fontSize = Math.max(
      8,
      Math.min(11, (width / baseWidth) * baseFontSize)
    );
    return fontSize;
  }, []);

  // Calculate optimal zoom level based on window dimensions with 0.1 granularity
  const calculateZoomLevel = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Base zoom calculation - larger screens get more zoom
    // Width has 2x weight, height has 1x weight (width is more important for horizontal map)
    const weightedScore = width * 2 + height * 1;
    let zoom;

    if (weightedScore < 2400) {
      zoom = 10.0;
    } else if (weightedScore < 2600) {
      zoom = 10.2;
    } else if (weightedScore < 2800) {
      zoom = 10.4;
    } else if (weightedScore < 3000) {
      zoom = 10.5;
    } else if (weightedScore < 3200) {
      zoom = 10.6;
    } else if (weightedScore < 3400) {
      zoom = 10.7;
    } else if (weightedScore < 3600) {
      zoom = 10.7;
    } else if (weightedScore < 3800) {
      zoom = 10.8;
    } else if (weightedScore < 4000) {
      zoom = 10.8;
    } else if (weightedScore < 4200) {
      zoom = 10.9;
    } else if (weightedScore < 4400) {
      zoom = 10.9;
    } else {
      zoom = 11;
    }

    console.log(
      `Calculated zoom level: ${zoom} for weighted score: ${weightedScore} (width: ${width}, height: ${height})`
    );

    return zoom;
  }, []);

  // Detect mobile and calculate zoom on resize
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
  }, [onPartLeave]);

  // Calculate arrow positions based on image dimensions and position
  const calculateArrowPositions = useCallback(() => {
    if (!mobileMapImageRef.current || !isMobile) return;

    const img = mobileMapImageRef.current;
    const rect = img.getBoundingClientRect();
    const containerRect = img.parentElement.getBoundingClientRect();

    // Only calculate if image has actual dimensions
    if (rect.width === 0 || rect.height === 0) return;

    // Calculate positions as percentages relative to the container
    // These are approximate positions on the map image for each part
    const positions = {
      West: {
        // Point to left-center area of map (West Island) - now below map
        target: {
          x:
            ((rect.left - containerRect.left + rect.width * 0.2) /
              containerRect.width) *
            100,
          y:
            ((rect.top - containerRect.top + rect.height * 0.4) /
              containerRect.height) *
            100,
        },
        label: {
          x: 15,
          y: 60,
        },
      },
      Central: {
        // Point to center-top area (Central North)
        target: {
          x:
            ((rect.left - containerRect.left + rect.width * 0.5) /
              containerRect.width) *
            100,
          y:
            ((rect.top - containerRect.top + rect.height * 0.3) /
              containerRect.height) *
            100,
        },
        label: {
          x: 50,
          y: 16,
        },
      },
      North: {
        // Point to right-top area (Montreal East/North) - moved closer
        target: {
          x:
            ((rect.left - containerRect.left + rect.width * 0.75) /
              containerRect.width) *
            100,
          y:
            ((rect.top - containerRect.top + rect.height * 0.11) /
              containerRect.height) *
            100,
        },
        label: {
          x: 92,
          y: 28,
        },
      },
      South: {
        // Point to center-bottom area (Downtown/Center South) - moved closer and right
        target: {
          x:
            ((rect.left - containerRect.left + rect.width * 0.65) /
              containerRect.width) *
            100,
          y:
            ((rect.top - containerRect.top + rect.height * 0.95) /
              containerRect.height) *
            100,
        },
        label: {
          x: 70,
          y: 80,
        },
      },
    };

    setArrowPositions(positions);
    // Show arrows after positions are calculated
    setTimeout(() => {
      setShowArrows(true);
    }, 50);
  }, [isMobile]);

  // Calculate arrow positions on image load and window resize
  useEffect(() => {
    if (isMobile && mobileMapImageRef.current) {
      const img = mobileMapImageRef.current;

      // Hide arrows initially when recalculating
      setShowArrows(false);

      const handleImageLoad = () => {
        // Use setTimeout to ensure DOM is fully settled and image is rendered
        setTimeout(() => {
          calculateArrowPositions();
        }, 150);
      };

      const handleResize = () => {
        setShowArrows(false);
        setTimeout(() => {
          calculateArrowPositions();
        }, 100);
      };

      if (img.complete && img.naturalWidth > 0) {
        // Image already loaded, calculate after a delay to ensure proper rendering
        setTimeout(() => {
          calculateArrowPositions();
        }, 200);
      } else {
        img.addEventListener("load", handleImageLoad);
      }

      window.addEventListener("resize", handleResize);

      return () => {
        img.removeEventListener("load", handleImageLoad);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isMobile, calculateArrowPositions]);

  // Force re-calculation after partData is loaded
  useEffect(() => {
    if (isMobile && partData && mobileMapImageRef.current) {
      setShowArrows(false);
      setTimeout(() => {
        calculateArrowPositions();
      }, 350);
    }
  }, [isMobile, partData, calculateArrowPositions]);

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

        // Rotate for visual appeal ONLY ON DESKTOP
        const centerPoint = { lat: 45.48, lng: -73.62 };
        const rotatedData = rotateGeoJSON(
          aggregated,
          335,
          centerPoint,
          1.3,
          1.3
        ); // Rotate on desktop

        // Rotate iconic locations with the same parameters
        const rotatedIconicLocations = rotateIconicLocations(
          ICONIC_LOCATIONS,
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
        setIconicLocations(rotatedIconicLocations);
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

  // Handle mobile part click - same logic as desktop click
  const handleMobilePartClick = (partName) => {
    console.log(`Mobile clicked on ${partName}`);

    // Find the feature for this part
    const feature = partData?.features.find(
      (f) => f.properties.part === partName
    );

    if (!feature) return;

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
      {/* BoomSold Logo - Top Left (Next to Hamburger) */}
      <div
        style={{
          position: "fixed",
          top: isMobile ? "3.5%" : "3.5vh",
          left: isMobile ? "auto" : "90px",
          right: isMobile ? "0px" : "auto",
          width: isMobile ? "100px" : "100px",
          height: isMobile ? "65px" : "65px",
          zIndex: 1500,
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
        <>
          {/* Toggle Button - Question Mark */}
          <button
            onClick={() => setShowInfoBox(!showInfoBox)}
            style={{
              position: "fixed",
              bottom: "30px",
              right: "30px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#FFD700",
              color: "#000",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              fontSize: "24px",
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 1001,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease, background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.backgroundColor = "#FFC107";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.backgroundColor = "#FFD700";
            }}
            aria-label="Toggle Info"
          >
            ?
          </button>

          {/* Info Box */}
          {showInfoBox && (
            <div
              className="info-bubble-container"
              style={{
                position: "absolute",
                bottom: "20%", // Positioned above the toggle button
                right: "30px",
                maxWidth: "340px",
                zIndex: 1000,
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  padding: "24px 28px",
                  borderRadius: "24px",
                  boxShadow:
                    "0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                  borderLeft: "6px solid #FFD700",
                  fontFamily: "'Nunito', sans-serif",
                  color: "#2d3436",
                  transform: "translateZ(0)",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoBox(false);
                  }}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(0,0,0,0.05)",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "16px",
                    color: "#636e72",
                    padding: 0,
                    lineHeight: 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0,0,0,0.1)";
                    e.target.style.color = "#000";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(0,0,0,0.05)";
                    e.target.style.color = "#636e72";
                  }}
                  aria-label="Close info"
                >
                  ×
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      background: "#FFF9C4",
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    💡
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#2d3436",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      Welcome to BoomSold
                    </h4>
                    <p
                      style={{
                        fontSize: "14px",
                        margin: 0,
                        lineHeight: "1.5",
                        color: "#636e72",
                        fontWeight: 500,
                      }}
                    >
                      We are here to simplify your real estate search. Select a
                      neighborhood to discover average home prices, amenities
                      nearby and more.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Montreal Island Header */}
      <h2 className="pm-selected-part-label">Welcome to Montreal</h2>

      {/* Top Heading */}
      <h2
        className="part-map-heading"
        style={{
          position: "relative",
          top: isMobile ? "4%" : "5%",
          width: isMobile ? "100%" : "90vw",
          textAlign: "center",
          zIndex: 1000,
          fontSize: isMobile ? "1.2rem" : "1.8rem",
          fontWeight: 300,
          color: "#2d3436",
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
        style={
          !isMobile
            ? { background: "transparent" }
            : { position: "relative", top: "-2%" }
        }
      >
        {isMobile ? (
          // Mobile view - Static image with interactive labels
          <div
            style={{
              width: "100%",
              height: "90%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              ref={mobileMapImageRef}
              src={MontrealMapImage}
              alt="Montreal Map"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />

            {/* Clickable map regions - invisible overlays */}
            {arrowPositions &&
              showArrows &&
              (() => {
                // Calculate image center position
                const img = mobileMapImageRef.current;
                const rect = img.getBoundingClientRect();
                const containerRect = img.parentElement.getBoundingClientRect();

                // Image center Y position as percentage
                const imageCenterY =
                  ((rect.top - containerRect.top + rect.height / 2) /
                    containerRect.height) *
                  100;

                return (
                  <>
                    {/* West Island clickable area - left side of map, top half */}
                    <div
                      onClick={() => handleMobilePartClick("West")}
                      style={{
                        position: "absolute",
                        left: `${arrowPositions.West.target.x - 18}%`,
                        top: `${
                          ((rect.top - containerRect.top) /
                            containerRect.height) *
                          100
                        }%`,

                        width: "32%",
                        height: `${
                          imageCenterY -
                          ((rect.top - containerRect.top) /
                            containerRect.height) *
                            100
                        }%`,
                        cursor: "pointer",
                        zIndex: 5,
                      }}
                    />

                    {/* Central North clickable area - center top, top half */}
                    <div
                      onClick={() => handleMobilePartClick("Central")}
                      style={{
                        position: "absolute",
                        left: `${arrowPositions.Central.target.x - 10}%`,
                        top: `${
                          ((rect.top - containerRect.top) /
                            containerRect.height) *
                          100
                        }%`,
                        width: "20%",
                        height: `${
                          imageCenterY -
                          ((rect.top - containerRect.top) /
                            containerRect.height) *
                            100
                        }%`,
                        cursor: "pointer",

                        zIndex: 5,
                      }}
                    />

                    {/* Montreal East/North clickable area - right top, top half */}
                    <div
                      onClick={() => handleMobilePartClick("North")}
                      style={{
                        position: "absolute",
                        left: `${arrowPositions.North.target.x - 8}%`,
                        top: `${
                          ((rect.top - containerRect.top) /
                            containerRect.height) *
                          100
                        }%`,
                        width: "26%",
                        height: `${
                          imageCenterY -
                          ((rect.top - containerRect.top) /
                            containerRect.height) *
                            100
                        }%`,
                        cursor: "pointer",
                        zIndex: 5,
                      }}
                    />

                    {/* Downtown/Center South clickable area - bottom half from center */}
                    <div
                      onClick={() => handleMobilePartClick("South")}
                      style={{
                        position: "absolute",
                        left: `${arrowPositions.South.target.x - 18}%`,
                        top: `${imageCenterY}%`,
                        width: "26%",
                        height: `${
                          ((rect.bottom - containerRect.top) /
                            containerRect.height) *
                            105 -
                          imageCenterY
                        }%`,
                        cursor: "pointer",
                        zIndex: 5,
                        transform: "rotate(-265deg)",
                      }}
                    />
                  </>
                );
              })()}

            {/* Interactive labels with arrows */}
            {arrowPositions && showArrows && (
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  opacity: 1,
                  transition: "opacity 0.3s ease-in",
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* Arrow to West Island - now pointing up from below */}
                <line
                  x1={arrowPositions.West.label.x}
                  y1={arrowPositions.West.label.y - 2}
                  x2={arrowPositions.West.target.x}
                  y2={arrowPositions.West.target.y}
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth="0.12"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />
                {/* Arrow to Central North */}
                <line
                  x1={arrowPositions.Central.label.x}
                  y1={arrowPositions.Central.label.y + 5}
                  x2={arrowPositions.Central.target.x}
                  y2={arrowPositions.Central.target.y}
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth="0.12"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />
                {/* Arrow to Montreal East/North */}
                <line
                  x1={arrowPositions.North.label.x - 8}
                  y1={arrowPositions.North.label.y}
                  x2={arrowPositions.North.target.x}
                  y2={arrowPositions.North.target.y}
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth="0.12"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />
                {/* Arrow to Downtown/Center South */}
                <line
                  x1={arrowPositions.South.label.x}
                  y1={arrowPositions.South.label.y - 2}
                  x2={arrowPositions.South.target.x}
                  y2={arrowPositions.South.target.y}
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth="0.12"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />

                {/* Arrowhead marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="5"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M 0 0 Q 8 3 0 6 Q 4 3 0 0"
                      fill="rgba(0, 0, 0, 0.4)"
                      stroke="none"
                    />
                  </marker>
                </defs>
              </svg>
            )}

            {/* Clickable text labels */}
            {/* West Island Label - moved below map */}
            <div
              onClick={() => handleMobilePartClick("West")}
              style={{
                position: "absolute",
                left: "15%",
                bottom: "40%",
                transform: "translateX(-50%)",
                fontSize: `${calculateButtonFontSize()}px`,
                fontWeight: 500,
                fontFamily: "'Jost', sans-serif",
                color: "#000000",
                backgroundColor: "#FFD700",
                padding: `${calculateButtonFontSize() * 0.6}px ${
                  calculateButtonFontSize() * 1
                }px`,
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 10,
                textAlign: "center",
                border: "1px solid #000000",

                textTransform: "uppercase",
                letterSpacing: "0.3px",
                pointerEvents: "auto",
                transition: "all 0.2s ease",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform =
                  "translateX(-50%) scale(0.95)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "translateX(-50%) scale(1)";
              }}
            >
              West
              <br />
              Island
            </div>

            {/* Central North Label */}
            <div
              onClick={() => handleMobilePartClick("Central")}
              style={{
                position: "absolute",
                left: "50%",
                top: "20%",
                transform: "translateX(-50%)",
                fontSize: `${calculateButtonFontSize()}px`,
                fontWeight: 500,
                color: "#000000",
                backgroundColor: "#FFD700",
                padding: `${calculateButtonFontSize() * 0.6}px ${
                  calculateButtonFontSize() * 1
                }px`,
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 10,
                textAlign: "center",
                border: "1px solid #000000",
                fontFamily: "'Jost', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                pointerEvents: "auto",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform =
                  "translateX(-50%) scale(0.95)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "translateX(-50%) scale(1)";
              }}
            >
              Central North
            </div>

            {/* Montreal East/North Label */}
            <div
              onClick={() => handleMobilePartClick("North")}
              style={{
                position: "absolute",
                right: "8%",
                top: "28%",
                transform: "translateY(-50%)",
                fontSize: `${calculateButtonFontSize()}px`,
                fontWeight: 500,
                color: "#000000",
                backgroundColor: "#FFD700",
                padding: `${calculateButtonFontSize() * 0.6}px ${
                  calculateButtonFontSize() * 1
                }px`,
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 10,
                textAlign: "center",
                border: "1px solid #000000",
                fontFamily: "'Jost', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                pointerEvents: "auto",
                transition: "all 0.2s ease",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-50%) scale(0.95)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              Montreal
              <br />
              East/North
            </div>

            {/* Downtown/Center South Label */}
            <div
              onClick={() => handleMobilePartClick("South")}
              style={{
                position: "absolute",
                left: "68%",
                bottom: "22%",
                transform: "translateX(-50%)",
                fontSize: `${calculateButtonFontSize()}px`,
                fontWeight: 500,
                color: "#000000",
                backgroundColor: "#FFD700",
                padding: `${calculateButtonFontSize() * 0.6}px ${
                  calculateButtonFontSize() * 1
                }px`,
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 10,
                textAlign: "center",
                border: "1px solid #000000",
                fontFamily: "'Jost', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                pointerEvents: "auto",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform =
                  "translateX(-50%) scale(0.95)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "translateX(-50%) scale(1)";
              }}
            >
              Downtown/
              <br />
              Center South
            </div>
          </div>
        ) : (
          // Desktop view - Interactive map
          <MapContainer
            center={[45.52, -73.62]}
            zoom={zoomLevel}
            style={{ height: "100%", width: "100%", background: "transparent" }}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            zoomAnimation={false}
            fadeAnimation={true}
            markerZoomAnimation={false}
            attributionControl={false}
            preferCanvas={false}
            maxBounds={null}
            maxBoundsViscosity={0.0}
            zoomSnap={0.1}
            zoomDelta={0.1}
            whenCreated={(mapInstance) => {
              setMap(mapInstance);
              // Remove any default tile layers
              mapInstance.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                  mapInstance.removeLayer(layer);
                }
              });

              // Disable all zoom and pan interactions completely
              mapInstance.dragging.disable();
              mapInstance.touchZoom.disable();
              mapInstance.doubleClickZoom.disable();
              mapInstance.scrollWheelZoom.disable();
              mapInstance.boxZoom.disable();
              mapInstance.keyboard.disable();
              if (mapInstance.tap) mapInstance.tap.disable();

              // Disable zoom animation to prevent any zoom changes
              mapInstance._zoomAnimated = false;

              // Fit to bounds when data is loaded
              if (partData) {
                const bounds = L.geoJSON(partData).getBounds();
                mapInstance.fitBounds(bounds, {
                  padding: [20, 20],
                  animate: false,
                  maxZoom: zoomLevel,
                });
              }
            }}
          >
            <ZoomUpdater zoomLevel={zoomLevel} />
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

              // Calculate font size based on zoom level - smaller for smaller zoom
              // Base font size at zoom 10.5, scale proportionally with smaller minimum
              const baseFontSize = 12; // Reduced from 14
              const baseZoom = 10.5;
              const fontSize = Math.max(
                8, // Minimum font size
                Math.round(baseFontSize * (zoomLevel / baseZoom))
              );

              // Calculate letter spacing based on zoom
              const baseLetterSpacing = 1.2; // Reduced from 1.5
              const letterSpacing = Math.max(
                0.5, // Minimum letter spacing
                baseLetterSpacing * (zoomLevel / baseZoom)
              );

              // Calculate padding based on zoom
              const basePadding = 3; // Reduced from 4
              const padding = Math.max(
                2, // Minimum padding
                Math.round(basePadding * (zoomLevel / baseZoom))
              );

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
                  font-size: ${fontSize}px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: ${letterSpacing}px;
                  text-shadow: 
                    0 0 8px rgba(255, 215, 0, 0.9),
                    0 0 12px rgba(255, 215, 0, 0.8),
                    1px 1px 2px rgba(0, 0, 0, 0.3);
                  white-space: nowrap;
                  pointer-events: none;
                  font-family: 'Nunito', sans-serif;
                  transform: translate(-50%, -50%);
                  background: transparent;
                  padding: ${padding}px ${padding * 2}px;
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
                  key={`${partName}-${zoomLevel}`}
                  position={[adjustedLat, adjustedLng]}
                  icon={textIcon}
                  interactive={false}
                />
              );
            })}

            {/* Add iconic location markers */}
            {iconicLocations.map((location) => (
              <Marker
                key={location.id}
                position={location.coordinates}
                icon={createIconicLocationIcon(location)}
                eventHandlers={{
                  click: (e) => {
                    const marker = e.target;
                    const popupContent = `
                      <div style="text-align: center; font-family: 'Nunito', sans-serif;">
                        <div style="font-size: 24px; margin-bottom: 8px;">${location.icon}</div>
                        <strong style="font-size: 16px; color: ${location.color};">${location.name}</strong>
                        <div style="font-size: 14px; color: #666; margin-top: 4px;">${location.description}</div>
                      </div>
                    `;
                    marker
                      .bindPopup(popupContent, {
                        maxWidth: 200,
                        className: "iconic-location-popup",
                      })
                      .openPopup();
                  },
                  mouseover: (e) => {
                    const marker = e.target;
                    const tooltipContent = `
                      <div style="text-align: center; font-family: 'Nunito', sans-serif;">
                        <span style="font-size: 12px; font-weight: 600;">${location.name}</span>
                      </div>
                    `;
                    marker
                      .bindTooltip(tooltipContent, {
                        permanent: false,
                        direction: "top",
                        offset: [0, -10],
                      })
                      .openTooltip();
                  },
                }}
              />
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default PartMap;
