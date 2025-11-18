const fs = require("fs");
const path = require("path");

// Fetch Montreal REM (Réseau express métropolitain) stations from Overpass API
async function fetchREMStations() {
  const overpassUrl = "https://overpass-api.de/api/interpreter";

  // Query for REM stations (new electric train network)
  const query = `
    [out:json][timeout:25];
    // Montreal area bounds
    (
      node["railway"="station"]["operator"="CDPQ Infra"](45.3,-74.1,45.8,-73.3);
      node["railway"="station"]["network"="REM"](45.3,-74.1,45.8,-73.3);
      node["railway"="station"]["network"="Réseau express métropolitain"](45.3,-74.1,45.8,-73.3);
      node["light_rail"="yes"]["operator"="CDPQ Infra"](45.3,-74.1,45.8,-73.3);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    console.log("Fetching REM stations...");

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
    console.log(`Found ${data.elements.length} REM station elements`);

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
              operator: element.tags.operator || "CDPQ Infra",
              line: element.tags.line || element.tags.route_ref || "REM",
              network: element.tags.network || "REM",
              type: "rem",
            });
          }
        }
      }
    });

    const stations = Array.from(stationsMap.values());
    console.log(`Processed ${stations.length} unique REM stations`);

    // If no data from API, add known REM stations manually
    if (stations.length === 0) {
      console.log(
        "No REM stations found via API, adding known stations manually..."
      );

      const knownREMStations = [
        {
          name: "Brossard",
          lat: 45.4508,
          lon: -73.4522,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Du Quartier",
          lat: 45.4633,
          lon: -73.4583,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Panama",
          lat: 45.4775,
          lon: -73.4675,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Îles-des-Soeurs",
          lat: 45.4858,
          lon: -73.5147,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Gare Centrale",
          lat: 45.4992,
          lon: -73.5669,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Édouard-Montpetit",
          lat: 45.5042,
          lon: -73.6133,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "McGill",
          lat: 45.5058,
          lon: -73.5758,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Griffintown-Bernard-Landry",
          lat: 45.49,
          lon: -73.5586,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Anse-à-l'Orme",
          lat: 45.4531,
          lon: -73.8689,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Sainte-Anne-de-Bellevue",
          lat: 45.4056,
          lon: -73.9456,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Sunnybrooke",
          lat: 45.4258,
          lon: -73.8647,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Technoparc Montréal",
          lat: 45.4486,
          lon: -73.7481,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Aéroport de Montréal-Trudeau",
          lat: 45.4706,
          lon: -73.7408,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Pointe-Claire",
          lat: 45.4483,
          lon: -73.8158,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Roxboro-Pierrefonds",
          lat: 45.4922,
          lon: -73.8361,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Deux-Montagnes",
          lat: 45.5392,
          lon: -73.8989,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Grand-Moulin",
          lat: 45.525,
          lon: -73.8839,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Bois-Franc",
          lat: 45.5075,
          lon: -73.7644,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Canora",
          lat: 45.515,
          lon: -73.695,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
        {
          name: "Mont-Royal",
          lat: 45.5183,
          lon: -73.64,
          operator: "CDPQ Infra",
          line: "REM",
          network: "REM",
          type: "rem",
        },
      ];

      knownREMStations.forEach((station) =>
        stationsMap.set(station.name, station)
      );
      console.log(`Added ${knownREMStations.length} known REM stations`);
    }

    const finalStations = Array.from(stationsMap.values());
    console.log(`Total REM stations: ${finalStations.length}`);

    // Save to JSON file
    const outputPath = path.join(
      __dirname,
      "../../public/assets/montreal_rem.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(finalStations, null, 2));
    console.log(`REM stations saved to ${outputPath}`);

    return finalStations;
  } catch (error) {
    console.error("Error fetching REM stations:", error);
    throw error;
  }
}

// Run the fetch
fetchREMStations()
  .then((stations) => {
    console.log("\n✓ Successfully fetched REM stations");
    console.log(`Total stations: ${stations.length}`);
  })
  .catch((error) => {
    console.error("\n✗ Failed to fetch REM stations:", error);
    process.exit(1);
  });
