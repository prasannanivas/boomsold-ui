import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";

// Professional Header Component
const ProfessionalHeader = () => {
  return (
    <div className="professional-header">
      <div className="header-content">
        <div className="brand-section">
          <img
            src="/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"
            alt="Boomsold"
            className="brand-logo"
          />
        </div>
      </div>
    </div>
  );
};

// Import the real Montreal data
const MontrealMap = ({
  onNeighborhoodHover,
  onNeighborhoodLeave,
  onNeighborhoodClick,
  startNeighborhoodAnimation = false,
}) => {
  const [montrealData, setMontrealData] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [shouldAnimateNeighborhoods, setShouldAnimateNeighborhoods] =
    useState(false);
  const geoJsonLayerRef = useRef(null);
  const animationAttemptsRef = useRef(0);
  const animationPlayedRef = useRef(false);

  const getFeatureLayers = useCallback(() => {
    const layerGroup = geoJsonLayerRef.current;
    if (!layerGroup) {
      return [];
    }

    const collectedLayers = [];
    layerGroup.eachLayer((layer) => {
      if (layer?.feature) {
        collectedLayers.push(layer);
      }
    });

    return collectedLayers;
  }, []);

  const applyInitialHiddenState = useCallback(
    (layersOverride) => {
      const layers = layersOverride ?? getFeatureLayers();
      let hiddenCount = 0;
      layers.forEach((layer) => {
        const pathElement = layer?.getElement();
        if (!pathElement) {
          return;
        }

        const duration = 0.85 + Math.random() * 0.5;
        const startOffset = -160 - Math.random() * 160;
        const rotation = (Math.random() * 18 - 9).toFixed(2);
        const swing = (-rotation / 3).toFixed(2);

        pathElement.classList.remove("neighborhood-falling");
        void pathElement.offsetWidth; // Reset animation state
        pathElement.style.setProperty(
          "--fall-duration",
          `${duration.toFixed(2)}s`
        );
        pathElement.style.setProperty("--fall-start-y", `${startOffset}px`);
        pathElement.style.setProperty("--fall-rotation", `${rotation}deg`);
        pathElement.style.setProperty("--fall-swing", `${swing}deg`);
        pathElement.classList.add("neighborhood-hidden");
        hiddenCount += 1;
      });

      return hiddenCount;
    },
    [getFeatureLayers]
  );

  const spawnDustBurst = useCallback(
    (layer) => {
      if (!map) {
        return;
      }

      const bounds = layer?.getBounds?.();
      if (!bounds) {
        return;
      }

      const center = bounds.getCenter();
      const containerPoint = map.latLngToContainerPoint(center);
      const container = map.getContainer();

      if (!containerPoint || !container) {
        return;
      }

      const dust = document.createElement("div");
      dust.className = "dust-burst";
      dust.style.left = `${containerPoint.x}px`;
      dust.style.top = `${containerPoint.y}px`;

      const particleCount = 6;
      for (let i = 0; i < particleCount; i += 1) {
        const particle = document.createElement("span");
        particle.className = "dust-particle";

        const angle = Math.random() * Math.PI * 2;
        const distance = 18 + Math.random() * 20;
        const verticalFactor = 0.5 + Math.random() * 0.4;
        const delay = 0.035 * i + Math.random() * 0.03;

        particle.style.setProperty(
          "--dust-x",
          `${Math.cos(angle) * distance}px`
        );
        particle.style.setProperty(
          "--dust-y",
          `${Math.sin(angle) * distance * verticalFactor}px`
        );
        particle.style.setProperty("--dust-delay", `${delay.toFixed(2)}s`);
        particle.style.setProperty(
          "--dust-scale",
          `${0.7 + Math.random() * 0.6}`
        );

        dust.appendChild(particle);
      }

      container.appendChild(dust);

      requestAnimationFrame(() => {
        dust.classList.add("dust-burst-active");
      });

      setTimeout(() => {
        dust.remove();
      }, 1400);
    },
    [map]
  );

  // Function to trigger neighborhood animations
  const triggerNeighborhoodAnimations = useCallback(() => {
    if (!montrealData) {
      console.log("❌ Cannot animate: missing map or data");
      return;
    }

    console.log("🎬 Starting neighborhood falling animations!");

    const layers = getFeatureLayers();

    if (!layers.length) {
      if (animationAttemptsRef.current < 5) {
        animationAttemptsRef.current += 1;
        console.log(
          `⏱️ No layers yet, retrying animation (attempt ${animationAttemptsRef.current})`
        );
        setTimeout(() => {
          triggerNeighborhoodAnimations();
        }, 300);
      } else {
        console.log(
          "⚠️ Unable to find neighborhood layers after multiple attempts"
        );
      }
      return;
    }

    animationAttemptsRef.current = 0;

    const hiddenCount = applyInitialHiddenState(layers);
    console.log(`🫥 Prepared ${hiddenCount} neighborhoods for animation`);

    const shuffledLayers = [...layers].sort(() => Math.random() - 0.5);

    setTimeout(() => {
      shuffledLayers.forEach((layer, index) => {
        const delay = index * 0.075 + Math.random() * 0.18;

        const startAnimation = (attempt = 0) => {
          const pathElement = layer?.getElement();
          if (!pathElement) {
            if (attempt < 5) {
              requestAnimationFrame(() => startAnimation(attempt + 1));
            }
            return;
          }

          pathElement.classList.remove("neighborhood-falling");
          void pathElement.offsetWidth; // Restart animation
          pathElement.style.setProperty("--fall-delay", `${delay.toFixed(2)}s`);

          requestAnimationFrame(() => {
            pathElement.classList.remove("neighborhood-hidden");
            pathElement.classList.add("neighborhood-falling");
          });
        };

        startAnimation();
      });
      console.log(`📊 Animating ${shuffledLayers.length} neighborhoods`);
    }, 160);
  }, [montrealData, applyInitialHiddenState, getFeatureLayers]);

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

  // Function to determine color based on price range - Comic Book Style Palette (Yellow/Black Theme)
  const getPriceColor = (price) => {
    if (!price) return "#FFD54F"; // Default: Sunny Yellow
    const numPrice =
      typeof price === "string" ? parseInt(price.replace(/[",]/g, "")) : price;

    if (numPrice >= 2000000) return "#FFD700"; // Ultra-Luxury: Pure Gold (matching logo)
    if (numPrice >= 1500000) return "#FFEB3B"; // Luxury: Bright Yellow
    if (numPrice >= 1200000) return "#aa9c1eff"; // High-End: Light Yellow
    if (numPrice >= 1000000) return "#FFD54F"; // Premium: Sunny Yellow
    if (numPrice >= 800000) return "#317f85ff"; // Upper-Mid: Soft Green
    if (numPrice >= 650000) return "#66BB6A"; // Mid-Range: Fresh Green
    if (numPrice >= 500000) return "#4DB6AC"; // Moderate: Teal
    return "#4DD0E1"; // Affordable: Bright Cyan
  };

  // Load both GeoJSON and CSV data
  React.useEffect(() => {
    Promise.all([
      fetch("/quartierreferencehabitation_merged.geojson").then((response) =>
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
            const defaultColor = isSuburb ? "#80CBC4" : "#4DD0E1"; // Soft teal for suburbs, bright cyan for unknown Montreal areas
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

        // Process merged data to ensure unified appearance
        const processedData = {
          ...geoJsonData,
          features: geoJsonData.features.map((feature) => {
            // For merged features, ensure they appear as single units
            if (feature.properties.merged_from > 1) {
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  // Mark as merged for styling
                  isMerged: true,
                  // Add special class for CSS targeting
                  className: "merged-borough",
                },
              };
            }
            return {
              ...feature,
              properties: {
                ...feature.properties,
                className: "single-borough",
              },
            };
          }),
        };

        setMontrealData(processedData);
        setIsMapLoaded(true);
      })
      .catch((error) => console.error("Error loading Montreal data:", error));
  }, []);

  // Initialize neighborhoods as hidden when map loads
  useEffect(() => {
    if (isMapLoaded && montrealData) {
      console.log("Initializing neighborhoods as hidden...");
      const timer = setTimeout(() => {
        const hiddenCount = applyInitialHiddenState();
        console.log(`Hidden ${hiddenCount} neighborhoods`);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isMapLoaded, montrealData, applyInitialHiddenState]);

  // Set flag when animation should start and trigger if map is already ready
  useEffect(() => {
    if (startNeighborhoodAnimation) {
      console.log("🎯 Animation requested, map ready:", !!map);
      setShouldAnimateNeighborhoods(true);

      // If map is already ready, trigger animations immediately
      if (montrealData) {
        console.log(
          "🚀 Map already ready - triggering animations immediately!"
        );
        setTimeout(() => {
          triggerNeighborhoodAnimations();
        }, 500);
      }
    }
  }, [
    startNeighborhoodAnimation,
    map,
    montrealData,
    triggerNeighborhoodAnimations,
  ]);

  // Fallback: Also try to trigger when map becomes available after animation request
  useEffect(() => {
    if (shouldAnimateNeighborhoods && montrealData) {
      console.log(
        "🔄 Fallback trigger - map became ready after animation request"
      );
      setTimeout(() => {
        triggerNeighborhoodAnimations();
      }, 1000);
    }
  }, [shouldAnimateNeighborhoods, montrealData, triggerNeighborhoodAnimations]);

  // Style function - visible borders for coordinate editing
  const getFeatureStyle = (feature) => {
    return {
      fillColor: feature.properties.color || "#4DD0E1",
      weight: 2, // Visible borders for coordinate editing
      opacity: 0.8, // Semi-transparent borders
      color: "#ffffff", // White border color for visibility
      fillOpacity: 0.8,
      // Add smooth joins for clean appearance
      lineJoin: "round",
      lineCap: "round",
    };
  }; // Hover style with projection effect and smart borders
  const getHoverStyle = () => ({
    weight: 4, // Bold border on hover for all areas
    color: "#000000", // Black border for strong contrast
    fillOpacity: 1.0,
    opacity: 1, // Always show border on hover, even for merged areas
    lineJoin: "round",
    lineCap: "round",
    // CSS transform for elevation effect
    className: "neighborhood-projected",
  });

  // Feature interaction handlers
  const onEachFeature = (feature, layer) => {
    const originalStyle = getFeatureStyle(feature);

    // Apply the original style to ensure colors are set
    layer.setStyle(originalStyle);

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

        // Call the leave handler to hide the overlay
        if (onNeighborhoodLeave) {
          onNeighborhoodLeave();
        }
      },
      click: () => {
        if (onNeighborhoodClick) {
          onNeighborhoodClick({
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
      {/* Professional Header */}
      <ProfessionalHeader />

      <div className="custom-montreal-map">
        <MapContainer
          center={[45.56, -73.62]}
          verticalFactor={0.5}
          zoom={10.8}
          minZoom={6}
          maxZoom={16}
          style={{ height: "100%", width: "100%" }}
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
            console.log("🗺️ Map created:", mapInstance);
            console.log(
              "📊 shouldAnimateNeighborhoods:",
              shouldAnimateNeighborhoods
            );
            console.log("📊 montrealData available:", !!montrealData);
            setMap(mapInstance);
            mapInstance.on("zoomend", () => {
              setCurrentZoom(mapInstance.getZoom());
            });

            // Trigger animation check when map is ready
            if (shouldAnimateNeighborhoods && montrealData) {
              console.log(
                "🚀 Map ready and animation requested - triggering animations!"
              );
              setTimeout(() => {
                triggerNeighborhoodAnimations();
              }, 1000); // Increased delay to ensure layers are ready
            } else {
              console.log(
                "⏳ Animation not ready yet - shouldAnimate:",
                shouldAnimateNeighborhoods,
                "data:",
                !!montrealData
              );
            }
          }}
        >
          <GeoJSON
            data={montrealData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
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
