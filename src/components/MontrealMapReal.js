import React, { useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";

// Import the real Montreal data
const MontrealMap = ({ onNeighborhoodHover }) => {
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState(null);
  const [montrealData, setMontrealData] = useState(null);

  // Load the GeoJSON data
  React.useEffect(() => {
    fetch("/montreal_real.geojson")
      .then((response) => response.json())
      .then((data) => {
        // Add colors and values to each feature
        data.features.forEach((feature, index) => {
          const colors = [
            "#4A9B8E",
            "#6BB577",
            "#8FCC88",
            "#F4E699",
            "#F7D794",
            "#F2B680",
            "#E88B5A",
            "#E76B4A",
            "#D35E47",
            "#B85450",
            "#A0525C",
            "#4A9B8E",
            "#6BB577",
            "#8FCC88",
            "#F4E699",
            "#F7D794",
            "#F2B680",
            "#E88B5A",
            "#E76B4A",
          ];
          const values = [
            "75.5",
            "78.1",
            "81.3",
            "77.4",
            "80.8",
            "79.5",
            "81.4",
            "76.7",
            "80.2",
            "77.2",
            "78.6",
            "79.3",
            "84.2",
            "86.5",
            "88.8",
            "81.9",
            "79.6",
            "73.1",
            "72.8",
          ];

          feature.properties.color = colors[index % colors.length];
          feature.properties.value = values[index % values.length];
        });
        setMontrealData(data);
      })
      .catch((error) => console.error("Error loading Montreal data:", error));
  }, []);

  // Style function for each neighborhood
  const getFeatureStyle = (feature) => ({
    fillColor: feature.properties.color,
    weight: 2,
    opacity: 1,
    color: "#FFFFFF",
    fillOpacity: 1.0,
  });

  // Hover style
  const getHoverStyle = () => ({
    weight: 3,
    color: "#000000",
    fillOpacity: 1.0,
  });

  // Feature interaction handlers
  const onEachFeature = (feature, layer) => {
    const originalStyle = getFeatureStyle(feature);

    // Add permanent tooltip with the value
    if (feature.properties && feature.properties.value) {
      layer
        .bindTooltip(feature.properties.value, {
          permanent: true,
          direction: "center",
          className: "neighborhood-label-tooltip",
        })
        .openTooltip();
    }

    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle(getHoverStyle());
        layer.bringToFront();
        setHoveredNeighborhood(feature.properties);
        if (onNeighborhoodHover) {
          onNeighborhoodHover({
            name: feature.properties.name,
            population: Math.floor(Math.random() * 100000) + 50000,
            averagePrice: `$${Math.floor(Math.random() * 200000) + 400000}`,
            description: `${feature.properties.name} neighborhood in Montreal`,
          });
        }
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(originalStyle);
        setHoveredNeighborhood(null);
      },
      click: () => {
        if (onNeighborhoodHover) {
          onNeighborhoodHover({
            name: feature.properties.name,
            population: Math.floor(Math.random() * 100000) + 50000,
            averagePrice: `$${Math.floor(Math.random() * 200000) + 400000}`,
            description: `${feature.properties.name} neighborhood in Montreal`,
          });
        }
      },
    });
  };

  if (!montrealData) {
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
          Loading Montreal Map...
        </div>
      </div>
    );
  }

  return (
    <div className="custom-montreal-map">
      <MapContainer
        center={[45.5088, -73.5878]}
        zoom={10}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <GeoJSON
          data={montrealData}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "10px 20px",
          borderRadius: "5px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#2d3436",
        }}
      >
        Montreal Neighborhoods
      </div>
    </div>
  );
};

export default MontrealMap;
