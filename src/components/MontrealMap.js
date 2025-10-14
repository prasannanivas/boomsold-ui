import React, { useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";

// Real Estate Color Palette Component
const RealEstatePalette = () => {
  const priceRanges = [
    { color: "#4A9B8E", label: "$300K-400K", name: "Affordable" },
    { color: "#6BB577", label: "$400K-500K", name: "Moderate" },
    { color: "#8FCC88", label: "$500K-600K", name: "Mid-Range" },
    { color: "#F4E699", label: "$600K-700K", name: "Upper-Mid" },
    { color: "#F7D794", label: "$700K-800K", name: "Premium" },
    { color: "#F2B680", label: "$800K-900K", name: "High-End" },
    { color: "#E88B5A", label: "$900K-1M", name: "Luxury" },
    { color: "#E76B4A", label: "$1M+", name: "Ultra-Luxury" },
  ];

  return (
    <div className="color-palette">
      <h3>Average Property Price by Neighborhood</h3>
      <div className="palette-items">
        {priceRanges.map((item, index) => (
          <div key={index} className="palette-item">
            <div
              className="color-box"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="color-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Import the real Montreal data
const MontrealMap = ({ onNeighborhoodHover }) => {
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState(null);
  const [montrealData, setMontrealData] = useState(null);

  // Load the GeoJSON data
  React.useEffect(() => {
    fetch("/montreal_real.geojson")
      .then((response) => response.json())
      .then((data) => {
        // Add real estate colors and average prices to each feature
        data.features.forEach((feature, index) => {
          const colors = [
            "#4A9B8E", // $300K-400K - Affordable
            "#6BB577", // $400K-500K - Moderate
            "#8FCC88", // $500K-600K - Mid-Range
            "#F4E699", // $600K-700K - Upper-Mid
            "#F7D794", // $700K-800K - Premium
            "#F2B680", // $800K-900K - High-End
            "#E88B5A", // $900K-1M - Luxury
            "#E76B4A", // $1M+ - Ultra-Luxury
            "#D35E47", // $1.2M+ - Premium Luxury
            "#B85450", // $1.5M+ - Elite
            "#A0525C", // $2M+ - Ultra-Elite
            "#4A9B8E", // Cycling back for additional neighborhoods
            "#6BB577",
            "#8FCC88",
            "#F4E699",
            "#F7D794",
            "#F2B680",
            "#E88B5A",
            "#E76B4A",
          ];
          // Real Montreal average property prices (in CAD thousands)
          const averagePrices = [
            "$485K", // Pierrefonds–Roxboro
            "$750K", // Côte-des-Neiges–Notre-Dame-de-Grâce
            "$620K", // Ahuntsic-Cartierville
            "$1.2M", // Outremont
            "$695K", // Plateau-Mont-Royal
            "$520K", // LaSalle
            "$580K", // Pointe-aux-Trembles-Rivières-des-Prairies
            "$665K", // Rosemont–La Petite-Patrie
            "$1.8M", // Ville-Marie (Downtown)
            "$545K", // Anjou
            "$480K", // Montréal-Nord
            "$475K", // Lachine
            "$590K", // Mercier–Hochelaga-Maisonneuve
            "$535K", // Saint-Laurent
            "$610K", // Saint-Léonard
            "$595K", // Villeray–Saint-Michel–Parc-Extension
            "$685K", // Sud-Ouest
            "$920K", // L'Île-Bizard–Sainte-Geneviève
            "$715K", // Verdun–Île-des-Sœurs
          ];

          feature.properties.color = colors[index % colors.length];
          feature.properties.value =
            averagePrices[index % averagePrices.length];
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
            averagePrice: feature.properties.value,
            pricePerSqft: `$${Math.floor(Math.random() * 200) + 300}/sq ft`,
            marketTrend: Math.random() > 0.5 ? "↗ +5.2%" : "↘ -2.1%",
            description: `Prime real estate in ${feature.properties.name}`,
            listingCount: Math.floor(Math.random() * 150) + 25,
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
            averagePrice: feature.properties.value,
            pricePerSqft: `$${Math.floor(Math.random() * 200) + 300}/sq ft`,
            marketTrend: Math.random() > 0.5 ? "↗ +8.1%" : "↘ -3.4%",
            description: `Explore properties in ${feature.properties.name}`,
            listingCount: Math.floor(Math.random() * 150) + 25,
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
    <div className="montreal-map-container">
      {/* Color Palette at the top */}
      <RealEstatePalette />

      <div className="custom-montreal-map">
        <MapContainer
          center={[45.5088, -73.5878]}
          zoom={10}
          style={{ height: "85vh", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <GeoJSON
            data={montrealData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        </MapContainer>

        {/* Title overlay */}
        <div className="map-title-overlay">
          Montreal Real Estate - Average Property Prices
        </div>
      </div>
    </div>
  );
};

export default MontrealMap;
