import React, { useState } from "react";
import "./App.css";
import MontrealMap from "./components/MontrealMap";
import NeighborhoodDetails from "./components/NeighborhoodDetails";
import AnimatedIntro from "./components/AnimatedIntro";

function App() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedNeighborhood, setPinnedNeighborhood] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = () => {
    console.log("Intro animation complete!");
    setShowIntro(false);
    // Start neighborhood animations after a short delay
    setTimeout(() => {
      console.log("Starting neighborhood animations...");
      setIntroComplete(true);
    }, 500);
  };

  React.useEffect(() => {
    console.log("Pinned neighborhood changed:", pinnedNeighborhood);
  }, [pinnedNeighborhood]);

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
      // Unpin
      setIsPinned(false);
      setPinnedNeighborhood(null);
      setIsHovering(false);
      setSelectedNeighborhood(null);
    } else {
      // Pin the clicked neighborhood
      setIsPinned(true);
      setPinnedNeighborhood(neighborhood);
      setSelectedNeighborhood(neighborhood);
      setIsHovering(true);
    }
  };

  const handleNeighborhoodLeave = () => {
    // Only hide if not pinned
    if (!isPinned) {
      setIsHovering(false);
      setSelectedNeighborhood(null);
    }
  };

  return (
    <div className="App">
      {showIntro && <AnimatedIntro onAnimationComplete={handleIntroComplete} />}

      <div className="map-container">
        <MontrealMap
          onNeighborhoodHover={handleNeighborhoodHover}
          onNeighborhoodLeave={handleNeighborhoodLeave}
          onNeighborhoodClick={handleNeighborhoodClick}
          startNeighborhoodAnimation={introComplete}
          isPinned={isPinned}
          pinnedNeighborhood={pinnedNeighborhood}
        />
        {/* Floating neighborhood details overlay */}
        <div
          className={`neighborhood-overlay ${
            (isHovering || isPinned) &&
            (selectedNeighborhood || pinnedNeighborhood)
              ? "visible"
              : ""
          } ${isPinned ? "pinned" : ""}`}
        >
          <NeighborhoodDetails
            neighborhood={isPinned ? pinnedNeighborhood : selectedNeighborhood}
            isPinned={isPinned}
            onUnpin={() => {
              setIsPinned(false);
              setPinnedNeighborhood(null);
              setIsHovering(false);
              setSelectedNeighborhood(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
