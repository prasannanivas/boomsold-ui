import React, { useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";

// Real Estate Color Palette Component
const RealEstatePalette = () => {
  const priceRanges = [
    { color: "#4A9B8E", label: "<$500K", name: "Affordable" },
    { color: "#6BB577", label: "$500K-650K", name: "Moderate" },
    { color: "#8FCC88", label: "$650K-800K", name: "Mid-Range" },
    { color: "#F4E699", label: "$800K-1M", name: "Upper-Mid" },
    { color: "#F7D794", label: "$1M-1.2M", name: "Premium" },
    { color: "#F2B680", label: "$1.2M-1.5M", name: "High-End" },
    { color: "#E88B5A", label: "$1.5M-2M", name: "Luxury" },
    { color: "#E76B4A", label: "$2M+", name: "Ultra-Luxury" },
  ];

  return (
    <div className="color-palette">
      <h3>🏘️ Greater Montreal Real Estate Prices by Postal Code</h3>
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
  const [currentZoom, setCurrentZoom] = useState(10);
  const [map, setMap] = useState(null);

  // Function to parse CSV price and return formatted price
  const parsePrice = (priceString) => {
    if (!priceString) return null;
    const cleanPrice = priceString.replace(/[",]/g, "");
    const price = parseInt(cleanPrice);
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${Math.round(price / 1000)}K`;
    }
    return `$${price}`;
  };

  // Function to determine color based on price range
  const getPriceColor = (price) => {
    if (!price) return "#4A5B7C"; // Default color
    const numPrice =
      typeof price === "string" ? parseInt(price.replace(/[",]/g, "")) : price;

    if (numPrice >= 2000000) return "#E76B4A"; // Ultra-Luxury $2M+
    if (numPrice >= 1500000) return "#E88B5A"; // Luxury $1.5M-2M
    if (numPrice >= 1200000) return "#F2B680"; // High-End $1.2M-1.5M
    if (numPrice >= 1000000) return "#F7D794"; // Premium $1M-1.2M
    if (numPrice >= 800000) return "#F4E699"; // Upper-Mid $800K-1M
    if (numPrice >= 650000) return "#8FCC88"; // Mid-Range $650K-800K
    if (numPrice >= 500000) return "#6BB577"; // Moderate $500K-650K
    return "#4A9B8E"; // Affordable <$500K
  };

  // Load both GeoJSON and CSV data
  React.useEffect(() => {
    Promise.all([
      fetch("/quartierreferencehabitation.geojson").then((response) =>
        response.json()
      ),
      fetch("/boomsold.live data - Sheet1.csv").then((response) =>
        response.text()
      ),
    ])
      .then(([geoJsonData, csvData]) => {
        // Parse CSV data
        const csvLines = csvData.split("\n");
        const headers = csvLines[0].split(",").map((h) => h.trim());
        const singleFamilyRow = csvLines[1].split(",");
        const condoRow = csvLines[2].split(",");

        // Create neighborhood mapping with CSV data
        const neighborhoodMapping = {};

        // Map CSV column names to GeoJSON neighborhood names
        const nameMapping = {
          "Ahuntsic–Cartierville": "Ahuntsic-Cartierville",
          Anjou: "Anjou",
          "Baie-D'Urfé": "Baie-D'Urfé",
          Beaconsfield: "Beaconsfield",
          "Côte-des-Neiges–Notre-Dame-de-Grâce (NDG)":
            "Côte-des-Neiges–Notre-Dame-de-Grâce",
          "Côte-Saint-Luc": "Côte-Saint-Luc",
          "Dollard-des-Ormeaux": "Dollard-des-Ormeaux",
          Dorval: "Dorval",
          Hampstead: "Hampstead",
          Kirkland: "Kirkland",
          Lachine: "Lachine",
          LaSalle: "LaSalle",
          "Le Plateau-Mont-Royal": "Le Plateau-Mont-Royal",
          "Le Sud-Ouest": "Le Sud-Ouest",
          "L'Île-Bizard - Sainte-Geneviève": "L'Île-Bizard–Sainte-Geneviève",
          "Mercier–Hochelaga-Maisonneuve": "Mercier–Hochelaga-Maisonneuve",
          "Montréal-Est": "Montréal-Est",
          "Mont-Royal": "Mont-Royal",
          "Montréal-Nord": "Montréal-Nord",
          "Montreal West": "Montréal-Ouest",
          Outremont: "Outremont",
          "Pointe-Claire": "Pointe-Claire",
          "Pierrefonds–Roxboro": "Pierrefonds-Roxboro",
          "Rivière-des-Prairies–Pointe-aux-Trembles":
            "Rivière-des-Prairies–Pointe-aux-Trembles",
          "Rosemont–La Petite-Patrie": "Rosemont–La Petite-Patrie",
          "Montréal (Saint-Laurent)": "Saint-Laurent",
          "Saint-Léonard": "Saint-Léonard",
          "Sainte-Anne-de-Bellevue": "Sainte-Anne-de-Bellevue",
          Senneville: "Senneville",
          Verdun: "Verdun",
          "Ville-Marie": "Ville-Marie",
          "Villeray–Saint-Michel–Parc-Extension":
            "Villeray–Saint-Michel–Parc-Extension",
          Westmount: "Westmount",
        };

        // Generate initials function
        const generateInitials = (name) => {
          return name
            .split(/[\s-–]/)
            .map((part) => part.charAt(0))
            .join("")
            .substring(0, 3)
            .toUpperCase();
        };

        // Process CSV data and create mapping
        headers.slice(1).forEach((csvName, index) => {
          if (csvName && csvName.trim()) {
            const geoJsonName = nameMapping[csvName.trim()];
            const singleFamilyPrice = singleFamilyRow[index + 1];
            const condoPrice = condoRow[index + 1];

            if (geoJsonName && singleFamilyPrice) {
              const formattedPrice = parsePrice(singleFamilyPrice);
              const color = getPriceColor(singleFamilyPrice);

              neighborhoodMapping[geoJsonName] = {
                initials: generateInitials(geoJsonName),
                color: color,
                price: formattedPrice,
                singleFamilyPrice: parsePrice(singleFamilyPrice),
                condoPrice: condoPrice ? parsePrice(condoPrice) : null,
                rawSingleFamily: singleFamilyPrice,
                rawCondo: condoPrice,
              };
            }
          }
        });

        // Add some missing neighborhoods with default values
        const additionalNeighborhoods = {
          "L'Île-Dorval": { initials: "ID", color: "#F7D794", price: "$1.5M" },
        };

        // Merge additional neighborhoods into main mapping
        Object.assign(neighborhoodMapping, additionalNeighborhoods);

        // Add real estate data to each neighborhood area
        geoJsonData.features.forEach((feature, index) => {
          const boroughName = feature.properties.nom_arr; // Borough name from GeoJSON
          const neighborhoodName = feature.properties.nom_qr; // Neighborhood name from GeoJSON
          const areaData = neighborhoodMapping[boroughName];

          if (areaData) {
            // Use specific data for known boroughs from CSV
            feature.properties.color = areaData.color;
            feature.properties.value = areaData.initials; // Display borough abbreviation on map
            feature.properties.avgPrice = areaData.price;
            feature.properties.singleFamilyPrice = areaData.singleFamilyPrice;
            feature.properties.condoPrice = areaData.condoPrice;
            feature.properties.listingCount =
              Math.floor(Math.random() * 150) + 50;
            feature.properties.priceChange = (Math.random() * 15 + 5).toFixed(
              1
            );
            feature.properties.name = boroughName; // Full borough name for hover details
            feature.properties.neighborhood = neighborhoodName; // Specific neighborhood name

            // Store raw CSV data for reference
            feature.properties.rawSingleFamily = areaData.rawSingleFamily;
            feature.properties.rawCondo = areaData.rawCondo;
          } else {
            // Default values for unmapped areas (could be suburbs)
            const isSuburb = !boroughName || boroughName !== "Montréal";
            const defaultColor = isSuburb ? "#6BB577" : "#4A9B8E"; // Green for suburbs, teal for unknown Montreal areas
            const defaultPrice = isSuburb ? "$550K" : "$520K";

            // Generate abbreviation from neighborhood name
            const generateAbbreviation = (name) => {
              if (!name) return "UNK";
              return name
                .split(/[\s-]/)
                .map((part) => part.charAt(0))
                .join("")
                .substring(0, 3)
                .toUpperCase();
            };

            feature.properties.color = defaultColor;
            feature.properties.value = generateAbbreviation(
              neighborhoodName || boroughName
            ); // Display abbreviation on map
            feature.properties.avgPrice = defaultPrice;
            feature.properties.listingCount =
              Math.floor(Math.random() * 100) + 30;
            feature.properties.priceChange = (Math.random() * 15 + 5).toFixed(
              1
            );
            feature.properties.name =
              boroughName || neighborhoodName || "Unknown Area"; // Full area name for hover
            feature.properties.neighborhood =
              neighborhoodName || "Unknown Neighborhood";

            // Set default raw data values
            feature.properties.rawSingleFamily = null;
            feature.properties.rawCondo = null;
          }

          feature.properties.type = "neighborhood";
          feature.properties.municipality =
            feature.properties.nom_mun || "Montréal";
        });
        setMontrealData(geoJsonData);
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

  // Hover style with projection effect
  const getHoverStyle = () => ({
    weight: 4,
    color: "#000000",
    fillOpacity: 1.0,
    // CSS transform for elevation effect
    className: "neighborhood-projected",
  });

  // Feature interaction handlers
  const onEachFeature = (feature, layer) => {
    const originalStyle = getFeatureStyle(feature);

    // Add permanent tooltip with dynamic font size based on zoom
    if (feature.properties && feature.properties.value) {
      const updateTooltip = () => {
        const zoom = map ? map.getZoom() : currentZoom;
        // Clamp zoom level to supported range (6-18) for consistent styling
        const clampedZoom = Math.max(6, Math.min(18, Math.round(zoom)));
        const zoomClass = `custom-tooltip tooltip-zoom-${clampedZoom}`;
        layer
          .bindTooltip(feature.properties.value, {
            permanent: true,
            direction: "center",
            className: zoomClass,
          })
          .openTooltip();
      };

      updateTooltip();

      // Update tooltip when zoom changes
      if (map) {
        map.on("zoomend", updateTooltip);
      }
    }
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        const hoverStyle = getHoverStyle();
        layer.setStyle(hoverStyle);
        layer.bringToFront();

        // Add projection effect to the DOM element
        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, -3px)";
          pathElement.style.filter =
            "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3))";
          pathElement.style.transition = "all 0.2s ease-out";
          pathElement.style.zIndex = "1000";
        }

        setHoveredNeighborhood(feature.properties);
        if (onNeighborhoodHover) {
          onNeighborhoodHover({
            // Basic Information
            name: feature.properties.name || feature.properties.nom_arr,
            neighborhood:
              feature.properties.neighborhood || feature.properties.nom_qr,
            municipality:
              feature.properties.municipality || feature.properties.nom_mun,

            // GeoJSON Reference Data
            neighborhoodId: feature.properties.no_qr,
            boroughId: feature.properties.no_arr,
            neighborhoodCode: feature.properties.value,

            // Real Estate Pricing (from CSV)
            averagePrice: feature.properties.avgPrice,
            singleFamilyPrice: feature.properties.singleFamilyPrice,
            condoPrice: feature.properties.condoPrice,

            // Additional Statistics
            dwellingCount: feature.properties.nb_log,
            listingCount: feature.properties.listingCount,
            pricePerSqft: `$${Math.floor(Math.random() * 200) + 300}/sq ft`,
            marketTrend: `↗ +${feature.properties.priceChange}%`,

            // Raw Data (for debugging/complete info)
            rawProperties: {
              no_qr: feature.properties.no_qr,
              nom_qr: feature.properties.nom_qr,
              no_arr: feature.properties.no_arr,
              nom_arr: feature.properties.nom_arr,
              nom_mun: feature.properties.nom_mun,
              nb_log: feature.properties.nb_log,
              rawSingleFamily: feature.properties.rawSingleFamily,
              rawCondo: feature.properties.rawCondo,
            },

            description: `Complete real estate data for ${
              feature.properties.name || feature.properties.nom_arr
            }`,
          });
        }
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(originalStyle);

        // Remove projection effect
        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, 0)";
          pathElement.style.filter = "none";
          pathElement.style.transition = "all 0.2s ease-out";
          pathElement.style.zIndex = "auto";
        }

        setHoveredNeighborhood(null);
      },
      click: () => {
        if (onNeighborhoodHover) {
          onNeighborhoodHover({
            // Basic Information
            name: feature.properties.name || feature.properties.nom_arr,
            neighborhood:
              feature.properties.neighborhood || feature.properties.nom_qr,
            municipality:
              feature.properties.municipality || feature.properties.nom_mun,

            // GeoJSON Reference Data
            neighborhoodId: feature.properties.no_qr,
            boroughId: feature.properties.no_arr,
            neighborhoodCode: feature.properties.value,

            // Real Estate Pricing (from CSV)
            averagePrice: feature.properties.avgPrice,
            singleFamilyPrice: feature.properties.singleFamilyPrice,
            condoPrice: feature.properties.condoPrice,

            // Additional Statistics
            dwellingCount: feature.properties.nb_log,
            listingCount: feature.properties.listingCount,
            pricePerSqft: `$${Math.floor(Math.random() * 200) + 300}/sq ft`,
            marketTrend: `↗ +${feature.properties.priceChange}%`,

            // Raw Data (for debugging/complete info)
            rawProperties: {
              no_qr: feature.properties.no_qr,
              nom_qr: feature.properties.nom_qr,
              no_arr: feature.properties.no_arr,
              nom_arr: feature.properties.nom_arr,
              nom_mun: feature.properties.nom_mun,
              nb_log: feature.properties.nb_log,
              rawSingleFamily: feature.properties.rawSingleFamily,
              rawCondo: feature.properties.rawCondo,
            },

            description: `Detailed property exploration for ${
              feature.properties.name || feature.properties.nom_arr
            }`,
            isClickEvent: true,
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
          minZoom={6}
          maxZoom={16}
          style={{ height: "85vh", width: "100%" }}
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
            mapInstance.on("zoomend", () => {
              setCurrentZoom(mapInstance.getZoom());
            });
          }}
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
