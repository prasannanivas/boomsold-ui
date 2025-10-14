import React, { useState } from "react";
import "./MontrealMap.css";

// Montreal neighborhoods with natural polygon boundaries like your reference
const montrealNeighborhoods = [
  {
    id: 1,
    name: "Ville-Marie",
    path: "M 250 200 L 320 195 L 325 240 L 290 260 L 250 250 Z",
    centerX: 285,
    centerY: 225,
    color: "#4A9B8E",
    value: "75.5",
  },
  {
    id: 2,
    name: "Sud-Ouest",
    path: "M 180 220 L 250 240 L 245 290 L 190 285 L 175 260 Z",
    centerX: 210,
    centerY: 255,
    color: "#6BB577",
    value: "78.1",
  },
  {
    id: 3,
    name: "Verdun",
    path: "M 150 280 L 190 285 L 240 290 L 235 330 L 155 325 Z",
    centerX: 195,
    centerY: 305,
    color: "#8FCC88",
    value: "81.3",
  },
  {
    id: 4,
    name: "Saint-Laurent",
    path: "M 200 120 L 300 115 L 295 190 L 180 195 L 190 160 Z",
    centerX: 245,
    centerY: 155,
    color: "#F4E699",
    value: "77.4",
  },
  {
    id: 5,
    name: "Ahuntsic-Cartierville",
    path: "M 280 80 L 400 75 L 395 150 L 320 155 L 300 115 Z",
    centerX: 340,
    centerY: 115,
    color: "#F7D794",
    value: "80.8",
  },
  {
    id: 6,
    name: "Plateau-Mont-Royal",
    path: "M 300 160 L 370 155 L 365 200 L 325 205 L 320 195 Z",
    centerX: 335,
    centerY: 180,
    color: "#F2B680",
    value: "79.5",
  },
  {
    id: 7,
    name: "Rosemont–La Petite-Patrie",
    path: "M 350 140 L 440 135 L 435 210 L 365 215 L 370 155 Z",
    centerX: 395,
    centerY: 175,
    color: "#E88B5A",
    value: "81.4",
  },
  {
    id: 8,
    name: "Villeray–Saint-Michel–Parc-Extension",
    path: "M 320 100 L 430 95 L 425 160 L 395 165 L 400 75 Z",
    centerX: 375,
    centerY: 130,
    color: "#E76B4A",
    value: "76.7",
  },
  {
    id: 9,
    name: "Côte-des-Neiges–Notre-Dame-de-Grâce",
    path: "M 160 160 L 250 155 L 245 240 L 175 245 L 180 195 Z",
    centerX: 205,
    centerY: 200,
    color: "#D35E47",
    value: "80.2",
  },
  {
    id: 10,
    name: "Mercier–Hochelaga-Maisonneuve",
    path: "M 400 180 L 500 175 L 495 260 L 435 265 L 440 210 Z",
    centerX: 450,
    centerY: 220,
    color: "#B85450",
    value: "77.2",
  },
  {
    id: 11,
    name: "Anjou",
    path: "M 480 150 L 550 145 L 545 210 L 500 215 L 505 175 Z",
    centerX: 515,
    centerY: 180,
    color: "#A0525C",
    value: "78.6",
  },
  {
    id: 12,
    name: "Saint-Léonard",
    path: "M 450 100 L 530 95 L 525 150 L 480 155 L 485 135 Z",
    centerX: 490,
    centerY: 125,
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
            {/* Neighborhood area - natural polygon shape */}
            <path
              d={neighborhood.path}
              fill={neighborhood.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
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
              x={neighborhood.centerX}
              y={neighborhood.centerY}
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
