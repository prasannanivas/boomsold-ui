import React, { useState } from "react";
import "./App.css";
import MontrealMap from "./components/MontrealMap";
import NeighborhoodDetails from "./components/NeighborhoodDetails";

function App() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  const handleNeighborhoodHover = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
  };

  return (
    <div className="App">
      <div className="app-container">
        <div className="map-section">
          <MontrealMap onNeighborhoodHover={handleNeighborhoodHover} />
        </div>
        <div className="details-section">
          <NeighborhoodDetails neighborhood={selectedNeighborhood} />
        </div>
      </div>
    </div>
  );
}

export default App;
