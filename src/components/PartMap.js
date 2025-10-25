import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import { rotateGeoJSON } from "./Utils";
import MontrealSvg from "./MontrealSvg";
import ProfessionalHeader from "./ProfessionalHeader";

// Function to get color based on neighborhood part (direction)
const getColorByPart = (part) => {
  const colorMap = {
    North: "#FF6B6B", // Red
    South: "#4ECDC4", // Teal
    East: "#FFE66D", // Yellow
    West: "#95E1D3", // Mint Green
  };
  return colorMap[part] || "#4DD0E1";
};

// Function to aggregate neighborhoods by part and merge geometries
const aggregateByPart = (geoJsonData) => {
  const partMap = {
    North: { features: [], color: "#FF6B6B" },
    South: { features: [], color: "#4ECDC4" },
    East: { features: [], color: "#FFE66D" },
    West: { features: [], color: "#95E1D3" },
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

        setPartData(rotatedData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading part data:", error);
        setIsLoading(false);
      });
  }, []);

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
              transform: hoveredPart === "North" ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#FF6B6B",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>North</span>
          </div>

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
                backgroundColor: "#4ECDC4",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>South</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transform: hoveredPart === "East" ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#FFE66D",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>East</span>
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
                backgroundColor: "#95E1D3",
                borderRadius: "3px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#333" }}>West</span>
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
        <div
          style={{
            position: "fixed",
            top: 120,
            left: "50%",
            // transform: "translateX(-50%)",
            backgroundColor: getColorByPart(hoveredPartName),
            color: hoveredPartName === "East" ? "#333" : "white",
            padding: "10px 24px",
            borderRadius: "6px",
            fontSize: "18px",
            fontWeight: 600,
            zIndex: 1001,
            pointerEvents: "none",
            animation: "fadeIn 0.3s ease-in-out",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          {hoveredPartName}
        </div>
      )}

      <div className="custom-montreal-map">
        <MapContainer
          center={[45.56, -73.62]}
          zoom={10.8}
          minZoom={6}
          maxZoom={22}
          style={{ height: "100%", width: "100%", background: "transparent" }}
          zoomControl={true}
          scrollWheelZoom={true}
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
        </MapContainer>
      </div>
    </div>
  );
};

export default PartMap;
