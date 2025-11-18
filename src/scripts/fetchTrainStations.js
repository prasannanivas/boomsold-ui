const fs = require("fs");
const path = require("path");

// Fetch Montreal train/commuter rail stations from Overpass API
async function fetchTrainStations() {
  const overpassUrl = "https://overpass-api.de/api/interpreter";

  // Query for Montreal commuter train stations (Exo network)
  const query = `
    [out:json][timeout:25];
    // Montreal area bounds
    (
      node["railway"="station"]["train"="yes"](45.3,-74.1,45.8,-73.3);
      node["railway"="halt"]["train"="yes"](45.3,-74.1,45.8,-73.3);
      node["public_transport"="station"]["train"="yes"](45.3,-74.1,45.8,-73.3);
      node["railway"="station"]["operator"~"Exo|AMT"](45.3,-74.1,45.8,-73.3);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    console.log("Fetching Montreal train stations...");

    const response = await fetch(overpassUrl, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.elements.length} train station elements`);

    // Process and deduplicate stations
    const stationsMap = new Map();

    data.elements.forEach((element) => {
      if (element.type === "node" && element.tags) {
        const name =
          element.tags.name ||
          element.tags["name:fr"] ||
          element.tags["name:en"];

        if (name) {
          // Use name as key to avoid duplicates
          if (!stationsMap.has(name)) {
            stationsMap.set(name, {
              name: name,
              lat: element.lat,
              lon: element.lon,
              operator: element.tags.operator || "Exo",
              line: element.tags.line || element.tags.route_ref || "unknown",
              network: element.tags.network || "Exo",
              type: "train",
            });
          }
        }
      }
    });

    const stations = Array.from(stationsMap.values());
    console.log(`Processed ${stations.length} unique train stations`);

    // Save to JSON file
    const outputPath = path.join(
      __dirname,
      "../../public/assets/montreal_trains.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));
    console.log(`Train stations saved to ${outputPath}`);

    return stations;
  } catch (error) {
    console.error("Error fetching train stations:", error);
    throw error;
  }
}

// Run the fetch
fetchTrainStations()
  .then((stations) => {
    console.log("\n✓ Successfully fetched train stations");
    console.log(`Total stations: ${stations.length}`);
  })
  .catch((error) => {
    console.error("\n✗ Failed to fetch train stations:", error);
    process.exit(1);
  });
