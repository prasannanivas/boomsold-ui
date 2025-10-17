import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import simplify from "simplify-js";
import "leaflet/dist/leaflet.css";
import "./MontrealMap.css";
import {
  parsePrice,
  getPriceColor,
  rotateGeoJSON,
  generateInitials,
  generateAbbreviation,
  nameMapping,
} from "./Utils";
import MontrealSvg from "./MontrealSvg";

// Simple point-in-polygon algorithm for [lat, lng] arrays
function isPointInPolygon(point, vs) {
  // point: [lat, lng], vs: array of [lat, lng]
  let x = point[1],
    y = point[0];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][1],
      yi = vs[i][0];
    let xj = vs[j][1],
      yj = vs[j][0];
    let intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Professional Header Component
const ProfessionalHeader = () => {
  return (
    <div className="professional-header">
      <div className="header-content">
        <div className="brand-section">
          <img
            src={
              process.env.PUBLIC_URL +
              "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"
            }
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
  isPinned = false,
  pinnedNeighborhood = null,
}) => {
  // Rotated (default) and Top-View (unrotated) datasets
  const [montrealData, setMontrealData] = useState(null); // rotated
  const [montrealDataTop, setMontrealDataTop] = useState(null); // unrotated (top view)

  const [currentZoom, setCurrentZoom] = useState(10);
  const [useSatellite, setUseSatellite] = useState(false);
  const [useTopView, setUseTopView] = useState(false); // when zoomed in, use unrotated data
  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [parkMarkers, setParkMarkers] = useState([]);
  const [schoolMarkers, setSchoolMarkers] = useState([]);
  const [hospitalMarkers, setHospitalMarkers] = useState([]);

  // Custom icons
  const treeIcon = L.icon({
    iconUrl: process.env.PUBLIC_URL + "/assets/park-icon.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [16, -16],
  });
  const schoolIcon = L.icon({
    iconUrl: process.env.PUBLIC_URL + "/assets/school-icon.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [16, -16],
  });
  const hospitalIcon = L.icon({
    iconUrl: process.env.PUBLIC_URL + "/assets/hospital-icon.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [16, -16],
  });

  const [shouldAnimateNeighborhoods, setShouldAnimateNeighborhoods] =
    useState(false);

  // Right-side panel state
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [parkImageLoading, setParkImageLoading] = useState(false);

  const pinnedRef = useRef(null);
  useEffect(() => {
    pinnedRef.current = pinnedNeighborhood;
  }, [pinnedNeighborhood]);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);

  const geoJsonLayerRef = useRef(null);
  const animationAttemptsRef = useRef(0);

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

  const splitAmenityMarkers = (elements, polygonLatLngs) => {
    const schools = [];
    const hospitals = [];

    const addIfInside = (lat, lon, name, amenity) => {
      if (lat && lon && isPointInPolygon([lat, lon], polygonLatLngs)) {
        const item = { lat, lon, name: name || amenity };
        if (amenity === "school") schools.push(item);
        if (amenity === "hospital") hospitals.push(item);
      }
    };

    elements.forEach((el) => {
      const amenity = el.tags && el.tags.amenity;
      if (amenity !== "school" && amenity !== "hospital") return;

      let lat, lon;
      if (el.type === "node") {
        lat = el.lat;
        lon = el.lon;
      } else if ((el.type === "way" || el.type === "relation") && el.center) {
        lat = el.center.lat;
        lon = el.center.lon;
      }
      const name = el.tags && (el.tags.name || el.tags["name:en"]);
      addIfInside(lat, lon, name, amenity);
    });

    return { schools, hospitals };
  };

  // Neighborhood animations
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

  // Load both GeoJSON and CSV data
  useEffect(() => {
    Promise.all([
      fetch(
        process.env.PUBLIC_URL + "/quartierreferencehabitation_merged.geojson"
      ).then((response) => response.json()),
      fetch(process.env.PUBLIC_URL + "/boomsold.live data - Sheet1.csv").then(
        (response) => response.text()
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

        Object.assign(neighborhoodMapping, additionalNeighborhoods);

        // Enrich features with data
        geoJsonData.features.forEach((feature) => {
          const boroughName = feature.properties.nom_arr;
          const neighborhoodName = feature.properties.nom_qr;
          const areaData = neighborhoodMapping[boroughName];

          if (areaData) {
            feature.properties.color = areaData.color;
            feature.properties.value = areaData.initials;
            feature.properties.avgPrice = areaData.price;
            feature.properties.singleFamilyPrice = areaData.singleFamilyPrice;
            feature.properties.condoPrice = areaData.condoPrice;
            feature.properties.listingCount =
              Math.floor(Math.random() * 150) + 50;
            feature.properties.priceChange = (Math.random() * 15 + 5).toFixed(
              1
            );
            feature.properties.name = boroughName;
            feature.properties.neighborhood = neighborhoodName;
            feature.properties.rawSingleFamily = areaData.rawSingleFamily;
            feature.properties.rawCondo = areaData.rawCondo;
          } else {
            const isSuburb = !boroughName || boroughName !== "Montréal";
            const defaultColor = isSuburb ? "#80CBC4" : "#4DD0E1";
            const defaultPrice = isSuburb ? "$550K" : "$520K";

            feature.properties.color = defaultColor;
            feature.properties.value = generateAbbreviation(
              neighborhoodName || boroughName
            );
            feature.properties.avgPrice = defaultPrice;
            feature.properties.listingCount =
              Math.floor(Math.random() * 100) + 30;
            feature.properties.priceChange = (Math.random() * 15 + 5).toFixed(
              1
            );
            feature.properties.name =
              boroughName || neighborhoodName || "Unknown Area";
            feature.properties.neighborhood =
              neighborhoodName || "Unknown Neighborhood";
            feature.properties.rawSingleFamily = null;
            feature.properties.rawCondo = null;
          }

          feature.properties.type = "neighborhood";
          feature.properties.municipality =
            feature.properties.nom_mun || "Montréal";
        });

        // Unified appearance metadata
        const processedData = {
          ...geoJsonData,
          features: geoJsonData.features.map((feature) => {
            if (feature.properties.merged_from > 1) {
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  isMerged: true,
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

        // Rotate the GeoJSON data with scaling to fix aspect ratio
        const centerPoint = { lat: 45.48, lng: -73.62 }; // Montreal center
        const rotatedData = rotateGeoJSON(
          processedData,
          335,
          centerPoint,
          1.2,
          1
        ); // 335° rotation, wider horizontally, shorter vertically

        // Keep both: rotated (default) and unrotated (top view)
        setMontrealData(rotatedData);
        setMontrealDataTop(processedData);
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
    // If pinned, only the pinned neighborhood is bright, others are dull
    if (isPinned && pinnedNeighborhood && pinnedNeighborhood.name) {
      const isPinnedFeature =
        feature.properties.name === pinnedNeighborhood.name;
      return {
        fillColor: isPinnedFeature
          ? feature.properties.color || "#4DD0E1"
          : "#e0e0e0", // dull gray for non-pinned
        weight: 2,
        opacity: 0.8,
        color: "#ffffff",
        fillOpacity: isPinnedFeature ? 0.85 : 0.1, // Make non-pinned more transparent
        lineJoin: "round",
        lineCap: "round",
        filter: isPinnedFeature ? "none" : "blur(0.5px) grayscale(0.5)",
      };
    }
    // Default: all neighborhoods bright, but outer transparent if satellite
    return {
      fillColor: feature.properties.color || "#4DD0E1",
      weight: 2,
      opacity: 0.8,
      color: "#ffffff",
      fillOpacity: useTopView ? 0.9 : useSatellite ? 0.5 : 0.8, // higher opacity for top view
      lineJoin: "round",
      lineCap: "round",
    };
  };

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

  // -------- Google Images + Wikipedia helpers --------
  const fetchFirstGoogleImage = async (query) => {
    const key = process.env.REACT_APP_GOOGLE_API_KEY;
    const cx = process.env.REACT_APP_GOOGLE_CSE_ID;
    if (!key || !cx) return null;
    try {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
        query
      )}&searchType=image&num=1&cx=${cx}&key=${key}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const item = data.items && data.items[0];
      return item ? item.link : null;
    } catch {
      return null;
    }
  };

  const fetchWikipediaImage = async (query) => {
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&format=json&origin=*`
      );
      const searchData = await searchRes.json();
      if (searchData?.query?.search?.length > 0) {
        const pageTitle = searchData.query.search[0].title;
        const pageRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(
            pageTitle
          )}&origin=*`
        );
        const pageData = await pageRes.json();
        const pages = pageData.query && pageData.query.pages;
        if (pages) {
          const firstPage = Object.values(pages)[0];
          if (firstPage?.original?.source) return firstPage.original.source;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const getPlaceImage = async (name, typeHint) => {
    const googleQuery = `${name} Montreal ${typeHint || ""}`.trim();
    const fromGoogle = await fetchFirstGoogleImage(googleQuery);
    if (fromGoogle) return fromGoogle;

    const fromWiki = await fetchWikipediaImage(`${name} Montreal`);
    if (fromWiki) return fromWiki;

    const fallbackMap = {
      park: "/assets/park-photo.jpg",
      school: "/assets/school-photo.jpg",
      hospital: "/assets/hospital-photo.jpg",
    };
    return (
      process.env.PUBLIC_URL + (fallbackMap[typeHint] || "/assets/no-image.png")
    );
  };
  // ---------------------------------------------------

  // Feature interaction handlers
  const onEachFeature = (feature, layer) => {
    const originalStyle = getFeatureStyle(feature);
    const finalColor = feature.properties.color || "#4DD0E1";

    // Apply Montreal flag colors initially (red/white pattern) only when not top view
    const initialColor = Math.random() > 0.3 ? "#ED1B2E" : "#FFFFFF";

    if (!useTopView) {
      layer.setStyle({
        ...originalStyle,
        fillColor: initialColor,
        fillOpacity: 0.9,
      });
    } else {
      layer.setStyle(originalStyle);
    }

    // Wait for element to be rendered, then apply animation
    const applyColorAnimation = () => {
      requestAnimationFrame(() => {
        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.setProperty("--final-color", finalColor);

          if (!useTopView) {
            // Start flag color animation after falling animation completes
            setTimeout(() => {
              const el = layer.getElement();
              if (el) {
                el.classList.add(
                  initialColor === "#FFFFFF"
                    ? "montreal-white-cross"
                    : "montreal-flag-colors"
                );
              }
            }, 2500); // Wait for falling animation to complete

            // Transition to actual price colors after flag animation
            setTimeout(() => {
              layer.setStyle(originalStyle);
              const el = layer.getElement();
              if (el) {
                el.classList.remove(
                  "montreal-flag-colors",
                  "montreal-white-cross"
                );
              }
            }, 5500); // 2.5s wait + 3s animation = 5.5s total
          } else {
            // In top view, immediately keep original style
            layer.setStyle(originalStyle);
          }
        }
      });
    };

    // Ensure layer is added to map before applying animation
    setTimeout(applyColorAnimation, 100);

    // Add permanent tooltip with dynamic font size based on zoom
    if (feature.properties && feature.properties.value) {
      const updateTooltip = () => {
        const zoom = map ? map.getZoom() : currentZoom;
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

        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.style.transform = "translate(0, 0)";
          pathElement.style.filter = "none";
          pathElement.style.transition = "all 0.2s ease-out";
          pathElement.style.zIndex = "auto";
        }

        if (onNeighborhoodLeave) {
          onNeighborhoodLeave();
        }
      },
      click: () => {
        // Ensure map is set from ref if not available
        let leafletMap = map;
        if (
          !leafletMap &&
          geoJsonLayerRef.current &&
          geoJsonLayerRef.current._map
        ) {
          leafletMap = geoJsonLayerRef.current._map;
          setMap(leafletMap);
        }

        // Check if clicking the same pinned neighborhood to unpin

        console.log(
          "Pinned neighborhood:",
          pinnedNeighborhood,
          "Clicked feature:",
          feature.properties.name
        );
        const currentPinned = pinnedRef.current;
        const isSameNeighborhood =
          currentPinned && currentPinned.name === feature.properties.name;
        if (isSameNeighborhood) {
          // Unpin: clear markers, reset view, clear selected place
          setParkMarkers([]);
          setSchoolMarkers([]);
          setHospitalMarkers([]);
          setSelectedPlace(null);

          leafletMap.setView([45.56, -73.62], 10.8); // Reset to original view
          if (onNeighborhoodClick) {
            onNeighborhoodClick({
              isUnpin: true,
              name: feature.properties.name || feature.properties.nom_arr,
            });
          }
          return;
        }

        // Zoom to neighborhood bounds and fetch amenities strictly inside polygon
        if (feature.geometry && feature.geometry.coordinates && leafletMap) {
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
          leafletMap.fitBounds(bounds, { maxZoom: 15 });

          // Clear old markers and show loading
          setParkMarkers([]);
          setSchoolMarkers([]);
          setHospitalMarkers([]);
          setIsLoadingMarkers(true);

          // Fetch parks, schools, and hospitals from Overpass API (single request)
          const bbox = `${southWest[0]},${southWest[1]},${northEast[0]},${northEast[1]}`;
          const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];
           (
             node[leisure=park](${bbox});
             way[leisure=park](${bbox});
             relation[leisure=park](${bbox});
             node[amenity~"^(school|hospital)$"](${bbox});
             way[amenity~"^(school|hospital)$"](${bbox});
             relation[amenity~"^(school|hospital)$"](${bbox});
           );
           out center;`;

          fetch(overpassUrl)
            .then((res) => res.json())
            .then((data) => {
              const parkList = [];
              if (data.elements) {
                // Create Leaflet polygon for strict inclusion test
                const polygonLatLngs = allCoords.map(([lng, lat]) => [
                  lat,
                  lng,
                ]);

                data.elements.forEach((el) => {
                  let lat, lon, name;
                  if (el.type === "node") {
                    lat = el.lat;
                    lon = el.lon;
                  } else if (el.type === "way" || el.type === "relation") {
                    if (el.center) {
                      lat = el.center.lat;
                      lon = el.center.lon;
                    }
                  }

                  const tags = el.tags || {};
                  name = tags.name || tags["name:en"];

                  // Parks
                  if (tags.leisure === "park" && lat && lon) {
                    if (isPointInPolygon([lat, lon], polygonLatLngs)) {
                      parkList.push({ lat, lon, name: name || "Park" });
                    }
                  }
                });

                // Split schools & hospitals using helper
                const { schools, hospitals } = splitAmenityMarkers(
                  data.elements,
                  polygonLatLngs
                );

                setParkMarkers(parkList);
                setSchoolMarkers(schools);
                setHospitalMarkers(hospitals);
                setIsLoadingMarkers(false);
                console.log(
                  `Fetched ${parkList.length} parks, ${schools.length} schools, ${hospitals.length} hospitals (strictly inside).`
                );
              }
            })
            .catch(() => {
              setParkMarkers([]);
              setSchoolMarkers([]);
              setHospitalMarkers([]);
              setIsLoadingMarkers(false);
            });
        } else {
          console.log("Error: No geometry, coordinates, or map found.");
        }
        if (onNeighborhoodClick) {
          onNeighborhoodClick({
            name: feature.properties.name || feature.properties.nom_arr,
            neighborhood:
              feature.properties.neighborhood || feature.properties.nom_qr,
            municipality:
              feature.properties.municipality || feature.properties.nom_mun,
            neighborhoodId: feature.properties.no_qr,
            boroughId: feature.properties.no_arr,
            neighborhoodCode: feature.properties.value,
            averagePrice: feature.properties.avgPrice,
            singleFamilyPrice: feature.properties.singleFamilyPrice,
            condoPrice: feature.properties.condoPrice,
            dwellingCount: feature.properties.nb_log,
            listingCount: feature.properties.listingCount,
            pricePerSqft: `$${Math.floor(Math.random() * 200) + 300}/sq ft`,
            marketTrend: `↗ +${feature.properties.priceChange}%`,
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

  // Custom hook to switch tile layer on zoom (also toggles top view)
  function SatelliteSwitcher() {
    const map = useMap();
    useEffect(() => {
      const onZoom = () => {
        const z = map.getZoom();
        console.log("Zoom level:", z);
        if (z >= 13) {
          if (!useSatellite) setUseSatellite(true);
          if (!useTopView) setUseTopView(true);
        } else {
          if (useSatellite) setUseSatellite(false);
          if (useTopView) setUseTopView(false);
        }
      };
      map.on("zoomend", onZoom);
      return () => map.off("zoomend", onZoom);
    }, [map, useSatellite, useTopView]);
    return null;
  }

  const placeTypeLabel =
    (selectedPlace &&
      { park: "Park", school: "School", hospital: "Hospital" }[
        selectedPlace.type
      ]) ||
    "Place";

  return (
    <div className="montreal-map-container">
      {/* Professional Header */}
      <ProfessionalHeader />

      {/* Montreal Flag Section - Above Map */}
      <MontrealSvg />

      <div className="custom-montreal-map" style={{ background: "" }}>
        <MapContainer
          center={[45.56, -73.62]}
          verticalFactor={0.5}
          zoom={10.8}
          minZoom={6}
          maxZoom={16}
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
            mapInstance.on("zoomend", () => {
              setCurrentZoom(mapInstance.getZoom());
            });
            if (shouldAnimateNeighborhoods && montrealData) {
              setTimeout(() => {
                triggerNeighborhoodAnimations();
              }, 1000);
            }
          }}
        >
          <SatelliteSwitcher />

          {/* Base/Satellite tiles */}
          {useSatellite ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}"
              attribution="Tiles © Esri"
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
          )}

          {/* GeoJSON: Top view (unrotated) when zoomed, else rotated */}
          <GeoJSON
            data={useTopView ? montrealDataTop : montrealData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
          />

          {/* Parks */}
          {parkMarkers.map((park, idx) => (
            <Marker
              key={`park-${idx}`}
              position={[park.lat, park.lon]}
              icon={treeIcon}
              eventHandlers={{
                click: async () => {
                  setParkImageLoading(true);
                  const imageUrl = await getPlaceImage(park.name, "park");
                  setSelectedPlace({
                    type: "park",
                    name: park.name,
                    lat: park.lat,
                    lon: park.lon,
                    image: imageUrl,
                  });
                  setParkImageLoading(false);
                },
              }}
            >
              <Popup>{park.name}</Popup>
            </Marker>
          ))}

          {/* Schools */}
          {schoolMarkers.map((school, idx) => (
            <Marker
              key={`school-${idx}`}
              position={[school.lat, school.lon]}
              icon={schoolIcon}
              eventHandlers={{
                click: async () => {
                  const imageUrl = await getPlaceImage(school.name, "school");
                  setSelectedPlace({
                    type: "school",
                    name: school.name,
                    lat: school.lat,
                    lon: school.lon,
                    image: imageUrl,
                  });
                },
              }}
            >
              <Popup>{school.name}</Popup>
            </Marker>
          ))}

          {/* Hospitals */}
          {hospitalMarkers.map((hospital, idx) => (
            <Marker
              key={`hospital-${idx}`}
              position={[hospital.lat, hospital.lon]}
              icon={hospitalIcon}
              eventHandlers={{
                click: async () => {
                  const imageUrl = await getPlaceImage(
                    hospital.name,
                    "hospital"
                  );
                  setSelectedPlace({
                    type: "hospital",
                    name: hospital.name,
                    lat: hospital.lat,
                    lon: hospital.lon,
                    image: imageUrl,
                  });
                },
              }}
            >
              <Popup>{hospital.name}</Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Loading indicator for markers */}
        {isLoadingMarkers && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.9)",
              padding: "10px 20px",
              borderRadius: "5px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              fontSize: "16px",
              color: "#333",
            }}
          >
            Loading markers...
          </div>
        )}
      </div>

      {/* Right-side image panel for selected place */}
      {selectedPlace && (
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 0,
            width: 340,
            background: "#fff",
            boxShadow: "0 0 16px rgba(0,0,0,0.15)",
            zIndex: 2000,
            padding: 18,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <button
            style={{
              alignSelf: "flex-end",
              marginBottom: 8,
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
            }}
            onClick={() => setSelectedPlace(null)}
            title="Close"
          >
            ×
          </button>
          <h3 style={{ margin: "8px 0 12px 0", fontWeight: 600 }}>
            {placeTypeLabel}: {selectedPlace.name}
          </h3>
          {selectedPlace.type === "park" && parkImageLoading ? (
            <div
              style={{
                width: 260,
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eee",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              Loading image...
            </div>
          ) : (
            <img
              src={selectedPlace.image}
              alt={selectedPlace.name}
              style={{
                width: 260,
                height: 180,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 12,
                background: "#eee",
              }}
              onError={(e) => {
                e.currentTarget.src =
                  process.env.PUBLIC_URL + "/assets/no-image.png";
              }}
            />
          )}
          <div style={{ fontSize: 15, color: "#555" }}>
            Lat: {selectedPlace.lat.toFixed(5)}, Lon:{" "}
            {selectedPlace.lon.toFixed(5)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MontrealMap;
