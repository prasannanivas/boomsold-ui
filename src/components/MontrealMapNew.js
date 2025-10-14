import React, { useState } from "react";
import "./MontrealMap.css";

// Montreal neighborhoods data - custom designed for clean appearance like your reference
const montrealNeighborhoods = [
  {
    id: 1,
    name: "Ville-Marie",
    x: 250,
    y: 200,
    width: 80,
    height: 60,
    color: "#4A9B8E",
    value: "75.5",
  },
  {
    id: 2,
    name: "Sud-Ouest",
    x: 180,
    y: 220,
    width: 70,
    height: 70,
    color: "#6BB577",
    value: "78.1",
  },
  {
    id: 3,
    name: "Verdun",
    x: 150,
    y: 280,
    width: 90,
    height: 50,
    color: "#8FCC88",
    value: "81.3",
  },
  {
    id: 4,
    name: "Saint-Laurent",
    x: 200,
    y: 120,
    width: 100,
    height: 80,
    color: "#F4E699",
    value: "77.4",
  },
  {
    id: 5,
    name: "Ahuntsic-Cartierville",
    x: 280,
    y: 80,
    width: 120,
    height: 90,
    color: "#F7D794",
    value: "80.8",
  },
  {
    id: 6,
    name: "Plateau-Mont-Royal",
    x: 300,
    y: 160,
    width: 70,
    height: 50,
    color: "#F2B680",
    value: "79.5",
  },
  {
    id: 7,
    name: "Rosemont–La Petite-Patrie",
    x: 350,
    y: 140,
    width: 90,
    height: 70,
    color: "#E88B5A",
    value: "81.4",
  },
  {
    id: 8,
    name: "Villeray–Saint-Michel–Parc-Extension",
    x: 320,
    y: 100,
    width: 110,
    height: 60,
    color: "#E76B4A",
    value: "76.7",
  },
  {
    id: 9,
    name: "Côte-des-Neiges–Notre-Dame-de-Grâce",
    x: 160,
    y: 160,
    width: 90,
    height: 80,
    color: "#D35E47",
    value: "80.2",
  },
  {
    id: 10,
    name: "Mercier–Hochelaga-Maisonneuve",
    x: 400,
    y: 180,
    width: 100,
    height: 80,
    color: "#B85450",
    value: "77.2",
  },
  {
    id: 11,
    name: "Anjou",
    x: 480,
    y: 150,
    width: 70,
    height: 60,
    color: "#A0525C",
    value: "78.6",
  },
  {
    id: 12,
    name: "Saint-Léonard",
    x: 450,
    y: 100,
    width: 80,
    height: 50,
    color: "#4A9B8E",
    value: "79.3",
  },
];

const MontrealMap = ({ onNeighborhoodHover }) => {
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState(null);

  const handleNeighborhoodHover = (neighborhood) => {
    setHoveredNeighborhood(neighborhood);
    if (onNeighborhoodHover) {
      onNeighborhoodHover({
        name: neighborhood.name,
        population: Math.floor(Math.random() * 100000) + 50000,
        averagePrice: `$${Math.floor(Math.random() * 200000) + 400000}`,
        description: `${neighborhood.name} neighborhood in Montreal`,
      });
    }
  };

  const handleNeighborhoodLeave = () => {
    setHoveredNeighborhood(null);
  };

  return (
    <div className="custom-montreal-map">
      <svg
        width="100%"
        height="100vh"
        viewBox="0 0 600 400"
        style={{ backgroundColor: "#e8f4f8" }}
      >
        {montrealNeighborhoods.map((neighborhood) => (
          <g key={neighborhood.id}>
            {/* Neighborhood area */}
            <rect
              x={neighborhood.x}
              y={neighborhood.y}
              width={neighborhood.width}
              height={neighborhood.height}
              fill={neighborhood.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              rx="5"
              ry="5"
              style={{
                cursor: "pointer",
                filter:
                  hoveredNeighborhood?.id === neighborhood.id
                    ? "brightness(1.1)"
                    : "none",
                transition: "filter 0.2s ease",
              }}
              onMouseEnter={() => handleNeighborhoodHover(neighborhood)}
              onMouseLeave={handleNeighborhoodLeave}
            />

            {/* Neighborhood value label */}
            <text
              x={neighborhood.x + neighborhood.width / 2}
              y={neighborhood.y + neighborhood.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="neighborhood-value-label"
              style={{
                fontSize: "18px",
                fontWeight: "900",
                fill: "#2d3436",
                fontFamily: "Arial, Helvetica, sans-serif",
                textShadow: "1px 1px 2px rgba(255, 255, 255, 0.8)",
                pointerEvents: "none",
              }}
            >
              {neighborhood.value}
            </text>
          </g>
        ))}

        {/* Map title */}
        <text
          x="300"
          y="30"
          textAnchor="middle"
          className="map-title"
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            fill: "#2d3436",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          Montreal Neighborhoods
        </text>
      </svg>
    </div>
  );
};

export default MontrealMap;
