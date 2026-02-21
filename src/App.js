import React, { useState, useEffect } from "react";
import "./App.css";
import "./mobile-optimizations.css";
import MontrealMap from "./components/MontrealMap";
import PartMap from "./components/PartMap";
import NeighborhoodMap from "./components/NeighborhoodMap";
import NeighborhoodDetails from "./components/NeighborhoodDetails";
import AnimatedIntro from "./components/AnimatedIntro";
import MobileLanding from "./components/MobileLanding";
import MobileSpecsSelection from "./components/MobileSpecsSelection";
import HelpGuide from "./components/HelpGuide";
import HeaderPalette from "./components/HeaderPalette";
import FooterPalette from "./components/FooterPalette";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import BuyPage from "./components/BuyPage";
import SellPage from "./components/SellPage";

function App() {
  const [currentPage, setCurrentPage] = useState("map"); // "map", "about", "buy", "sell"
  const [showPalette, setShowPalette] = useState(false); // Toggle to show header palette
  const [showFooterPalette, setShowFooterPalette] = useState(false); // Toggle to show footer palette
  const [selectedPart, setSelectedPart] = useState(null); // None = show PartMap, else = show MontrealMap
  const [selectedPartGeoJSON, setSelectedPartGeoJSON] = useState(null); // Filtered GeoJSON for selected part
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedNeighborhoodGeoJSON, setSelectedNeighborhoodGeoJSON] =
    useState(null); // Filtered GeoJSON for selected neighborhood
  const [isHovering, setIsHovering] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedNeighborhood, setPinnedNeighborhood] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Detect mobile device
  const [showMobileLanding, setShowMobileLanding] = useState(isMobile); // Show mobile landing for mobile users
  const [showSpecsScreen, setShowSpecsScreen] = useState(false); // Show specs selection screen on mobile
  const [pendingNeighborhood, setPendingNeighborhood] = useState(null); // Store neighborhood data until spec is selected
  const [hasScrolledPastLanding, setHasScrolledPastLanding] = useState(false); // Track if user scrolled past landing

  React.useEffect(() => {
    console.log("Pinned neighborhood changed:", pinnedNeighborhood);
  }, [pinnedNeighborhood]);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Show mobile landing if switching to mobile view
      if (mobile && currentPage === "map" && !showMobileLanding) {
        setShowMobileLanding(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentPage, showMobileLanding]);

  // Track scroll position for mobile landing
  useEffect(() => {
    if (!isMobile || !showMobileLanding || currentPage !== "map") return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      // Show header when scrolled past 30vh (about half of the 50vh landing)
      setHasScrolledPastLanding(scrollPosition > window.innerHeight * 0.3);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, showMobileLanding, currentPage]);

  // Handle browser back navigation
  useEffect(() => {
    const handlePopState = (event) => {
      setIsNavigatingBack(true);

      console.log("Browser back button pressed");

      // Determine current view and navigate back one level
      if (showSpecsScreen) {
        // Currently on specs screen → Go back to area selection
        setShowSpecsScreen(false);
        setPendingNeighborhood(null);
      } else if (isPinned && selectedNeighborhoodGeoJSON) {
        // Currently on NeighborhoodMap → Go back to MontrealMap
        setIsPinned(false);
        setPinnedNeighborhood(null);
        setIsHovering(false);
        setSelectedNeighborhood(null);
        setSelectedNeighborhoodGeoJSON(null);
      } else if (selectedPart !== null) {
        // Currently on MontrealMap → Go back to PartMap
        setSelectedPart(null);
        setSelectedPartGeoJSON(null);
        setSelectedNeighborhoodGeoJSON(null);
        setIsPinned(false);
        setPinnedNeighborhood(null);
      }

      setTimeout(() => setIsNavigatingBack(false), 100);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isPinned, selectedNeighborhoodGeoJSON, selectedPart, showSpecsScreen]);

  const handleNeighborhoodHover = (neighborhood) => {
    // Only update if not pinned
    if (!isPinned) {
      setSelectedNeighborhood(neighborhood);
      setIsHovering(true);
    }
    // When pinned, ignore hover events to keep the pinned content
  };

  const handleNeighborhoodClick = (neighborhood) => {
    console.log("Neighborhood click:", neighborhood);
    if (neighborhood.isUnpin) {
      // Unpin - navigate back in history
      if (!isNavigatingBack) {
        window.history.back();
      }
      setIsPinned(false);
      setPinnedNeighborhood(null);
      setIsHovering(false);
      setSelectedNeighborhood(null);
      setSelectedNeighborhoodGeoJSON(null);
      setShowSpecsScreen(false);
      setPendingNeighborhood(null);
    } else {
      // On mobile, show specs screen first
      if (isMobile) {
        setShowMobileLanding(false); // Close mobile landing
        setPendingNeighborhood(neighborhood);
        setShowSpecsScreen(true);
        // Add history entry so back button works
        if (!isNavigatingBack) {
          window.history.pushState({}, "", "");
        }
      } else {
        // Desktop: Pin the neighborhood immediately
        setIsPinned(true);
        setPinnedNeighborhood(neighborhood);
        setSelectedNeighborhood(neighborhood);
        setIsHovering(true);

        // Set filtered GeoJSON if provided
        if (neighborhood.filteredGeoJSON) {
          setSelectedNeighborhoodGeoJSON(neighborhood.filteredGeoJSON);
        }

        // Add history entry so back button works
        if (!isNavigatingBack) {
          window.history.pushState({}, "", "");
        }
      }
    }
  };

  const handleNeighborhoodLeave = () => {
    // Only hide if not pinned
    if (!isPinned) {
      setIsHovering(false);
      setSelectedNeighborhood(null);
    }
  };

  const handleSpecSelect = (specId) => {
    console.log("Spec selected:", specId);
    
    // Handle Contact Me - open email
    if (specId === "contact") {
      window.location.href = "mailto:info@boomsold.com?subject=Property Inquiry - Montreal&body=Hi, I'm interested in learning more about properties in this area.";
      // Close specs screen but don't pin
      setShowSpecsScreen(false);
      setPendingNeighborhood(null);
      return;
    }
    
    // After spec is selected, proceed with pinning the neighborhood
    if (pendingNeighborhood) {
      setIsPinned(true);
      setPinnedNeighborhood(pendingNeighborhood);
      setSelectedNeighborhood(pendingNeighborhood);
      setIsHovering(true);

      // Set filtered GeoJSON if provided
      if (pendingNeighborhood.filteredGeoJSON) {
        setSelectedNeighborhoodGeoJSON(pendingNeighborhood.filteredGeoJSON);
      }

      // Hide specs screen
      setShowSpecsScreen(false);
      setPendingNeighborhood(null);
      
      // Scroll to the appropriate section after a delay for content to render
      setTimeout(() => {
        let sectionId = null;
        switch(specId) {
          case "market-value":
            sectionId = "market-value-section";
            break;
          case "amenities":
            sectionId = "amenities-section";
            break;
          case "convinience":
            // Scroll to the map legend/POI area
            sectionId = "amenities-section"; // Use amenities as it shows POI
            break;
          default:
            break;
        }
        
        if (sectionId) {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            // Additional scroll to account for any fixed headers
            window.scrollBy({ top: -20, behavior: "smooth" });
          } else {
            console.log("Element not found:", sectionId);
          }
        }
      }, 1000);
    }
  };

  const handleSpecsBack = () => {
    // Go back from specs screen to area selection
    setShowSpecsScreen(false);
    setPendingNeighborhood(null);
    if (!isNavigatingBack) {
      window.history.back();
    }
  };

  const handlePartClick = (partInfo) => {
    console.log("Part clicked:", partInfo);
    if (isMobile) {
      setShowMobileLanding(false); // Close mobile landing
    }
    setSelectedPart(partInfo.partName);
    setSelectedPartGeoJSON(partInfo.geoJSON);

    // Add history entry so back button works
    if (!isNavigatingBack) {
      window.history.pushState({}, "", "");
    }
  };

  const handlePartHover = (partInfo) => {
    console.log("Part hover:", partInfo);
  };

  const handlePartLeave = () => {
    console.log("Part leave");
  };

  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: isMobile && showMobileLanding && currentPage === "map" ? "150vh" : "100vh",
            height: isMobile && showMobileLanding && currentPage === "map" ? "auto" : "100vh",
          }}
        >
          {/* Conditionally render header based on mobile landing state */}
          {!(isPinned && selectedNeighborhoodGeoJSON) && (
            // Hide header only when mobile landing is visible and not scrolled
            !(isMobile && showMobileLanding && currentPage === "map" && !hasScrolledPastLanding)
          ) && <Header onNavigate={setCurrentPage} currentPage={currentPage} />}

          {/* Mobile Landing Page */}
          {isMobile && showMobileLanding && currentPage === "map" && (
            <MobileLanding onExplore={() => setShowMobileLanding(false)} />
          )}

          {/* Mobile Specs Selection */}
          {isMobile && showSpecsScreen && !showMobileLanding && (
            <MobileSpecsSelection
              onSpecSelect={handleSpecSelect}
              onBack={handleSpecsBack}
            />
          )}

          {/* {showIntro && <AnimatedIntro onAnimationComplete={handleIntroComplete} />} */}

          {/* Help Guide for first-time users - REMOVED as per request */}
          {/* {!isMobile && <HelpGuide />} */}

          {/* Show info pages or map based on currentPage */}
          {currentPage === "about" ? (
            <AboutUs />
          ) : currentPage === "buy" ? (
            <BuyPage />
          ) : currentPage === "sell" ? (
            <SellPage />
          ) : (
          <div
            className="map-container"
            style={{
              flex: 1,
              position: "relative",
              overflow:
                isPinned && selectedNeighborhoodGeoJSON ? "auto" : "hidden",
              touchAction:
                isPinned && selectedNeighborhoodGeoJSON ? "auto" : "none",
            }}
          >
            {selectedPart === null ? (
              // Show PartMap
              <PartMap
                onPartClick={handlePartClick}
                onPartHover={handlePartHover}
                onPartLeave={handlePartLeave}
              />
            ) : isPinned && selectedNeighborhoodGeoJSON ? (
              // Show NeighborhoodMap for selected neighborhood
              <>
                <Header onNavigate={setCurrentPage} currentPage={currentPage} />
                <NeighborhoodMap
                  neighborhoodGeoJSON={selectedNeighborhoodGeoJSON}
                  neighborhoodInfo={pinnedNeighborhood}
                  onBack={() => {
                    // Use browser back instead of direct state change
                    if (!isNavigatingBack) {
                      window.history.back();
                    } else {
                      // If already navigating back, just update state
                      setIsPinned(false);
                      setPinnedNeighborhood(null);
                      setIsHovering(false);
                      setSelectedNeighborhood(null);
                      setSelectedNeighborhoodGeoJSON(null);
                    }
                  }}
                />
                <Footer />
              </>
            ) : (
              // Show MontrealMap for selected part
              <MontrealMap
                selectedPart={selectedPart}
                partGeoJSON={selectedPartGeoJSON}
                onPartBack={() => {
                  // Always go back to PartMap directly
                  setSelectedPart(null);
                  setSelectedPartGeoJSON(null);
                  setSelectedNeighborhoodGeoJSON(null);
                  setIsPinned(false);
                  setPinnedNeighborhood(null);
                }}
                onNeighborhoodHover={handleNeighborhoodHover}
                onNeighborhoodLeave={handleNeighborhoodLeave}
                onNeighborhoodClick={handleNeighborhoodClick}
                startNeighborhoodAnimation={introComplete}
                isPinned={isPinned}
                pinnedNeighborhood={pinnedNeighborhood}
              />
            )}
            {/* Floating neighborhood details overlay - only show on MontrealMap, not NeighborhoodMap */}
            {!isMobile && selectedPart !== null && !isPinned && (
              <div
                className={`neighborhood-overlay ${
                  isHovering && selectedNeighborhood ? "visible" : ""
                }`}
              >
                <NeighborhoodDetails
                  neighborhood={selectedNeighborhood}
                  isPinned={false}
                  onUnpin={() => {
                    setIsPinned(false);
                    setPinnedNeighborhood(null);
                    setIsHovering(false);
                    setSelectedNeighborhood(null);
                  }}
                />
              </div>
            )}
          </div>
          )}
        </div>
        {!(isPinned && selectedNeighborhoodGeoJSON) && <Footer onNavigate={setCurrentPage} />}
      </div>
    </div>
  );
}

export default App;
