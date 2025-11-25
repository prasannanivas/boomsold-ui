import React, { useState, useEffect } from "react";
import "./App.css";
import "./mobile-optimizations.css";
import MontrealMap from "./components/MontrealMap";
import PartMap from "./components/PartMap";
import NeighborhoodMap from "./components/NeighborhoodMap";
import NeighborhoodDetails from "./components/NeighborhoodDetails";
import AnimatedIntro from "./components/AnimatedIntro";
import HelpGuide from "./components/HelpGuide";
import HeaderPalette from "./components/HeaderPalette";
import FooterPalette from "./components/FooterPalette";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
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

  React.useEffect(() => {
    console.log("Pinned neighborhood changed:", pinnedNeighborhood);
  }, [pinnedNeighborhood]);

  // Handle browser back navigation
  useEffect(() => {
    const handlePopState = (event) => {
      setIsNavigatingBack(true);

      console.log("Browser back button pressed");

      // Determine current view and navigate back one level
      if (isPinned && selectedNeighborhoodGeoJSON) {
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
  }, [isPinned, selectedNeighborhoodGeoJSON, selectedPart]);

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
    } else {
      // Pin the clicked neighborhood
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
  };

  const handleNeighborhoodLeave = () => {
    // Only hide if not pinned
    if (!isPinned) {
      setIsHovering(false);
      setSelectedNeighborhood(null);
    }
  };

  const handlePartClick = (partInfo) => {
    console.log("Part clicked:", partInfo);
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
            height: "100vh",
          }}
        >
          {!(isPinned && selectedNeighborhoodGeoJSON) && <Header />}

          {/* {showIntro && <AnimatedIntro onAnimationComplete={handleIntroComplete} />} */}

          {/* Help Guide for first-time users - REMOVED as per request */}
          {/* {!isMobile && <HelpGuide />} */}

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
                <Header />
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
        </div>
        {!(isPinned && selectedNeighborhoodGeoJSON) && <Footer />}
      </div>
    </div>
  );
}

export default App;
