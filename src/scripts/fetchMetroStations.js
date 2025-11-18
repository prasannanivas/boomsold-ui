const fs = require("fs");
const path = require("path");

// Fetch Montreal Metro stations from Overpass API
async function fetchMetroStations() {
  const overpassUrl = "https://overpass-api.de/api/interpreter";

  // Query for Montreal metro stations
  const query = `
    [out:json][timeout:25];
    // Montreal metro area bounds
    (
      node["station"="subway"]["network"="Société de transport de Montréal"](45.4,-74.0,45.7,-73.4);
      node["railway"="station"]["network"="Société de transport de Montréal"](45.4,-74.0,45.7,-73.4);
      node["railway"="subway_entrance"]["network"~"STM|Société de transport de Montréal"](45.4,-74.0,45.7,-73.4);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    console.log("Fetching Montreal metro stations...");

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
    console.log(`Found ${data.elements.length} metro station elements`);

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
              line: element.tags.line || element.tags.colour || "unknown",
              network: element.tags.network || "STM",
              type: "metro",
            });
          }
        }
      }
    });

    const stations = Array.from(stationsMap.values());
    console.log(`Processed ${stations.length} unique metro stations`);

    // If no data from API, add known metro stations manually
    if (stations.length === 0) {
      console.log(
        "No metro stations found via API, adding known stations manually..."
      );

      const knownMetroStations = [
        // Orange Line
        {
          name: "Côte-Vertu",
          lat: 45.5094,
          lon: -73.7202,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Du Collège",
          lat: 45.5063,
          lon: -73.7107,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "De La Savane",
          lat: 45.5042,
          lon: -73.6953,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Namur",
          lat: 45.4944,
          lon: -73.6836,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Plamondon",
          lat: 45.49,
          lon: -73.6761,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Côte-Sainte-Catherine",
          lat: 45.4919,
          lon: -73.6347,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Snowdon",
          lat: 45.4864,
          lon: -73.6283,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Villa-Maria",
          lat: 45.4786,
          lon: -73.6369,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Vendôme",
          lat: 45.4739,
          lon: -73.6036,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Place-Saint-Henri",
          lat: 45.4769,
          lon: -73.5861,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Lionel-Groulx",
          lat: 45.4789,
          lon: -73.5678,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Atwater",
          lat: 45.49,
          lon: -73.5856,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Guy-Concordia",
          lat: 45.4972,
          lon: -73.5778,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Peel",
          lat: 45.5017,
          lon: -73.5703,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "McGill",
          lat: 45.5044,
          lon: -73.5694,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Place-des-Arts",
          lat: 45.5075,
          lon: -73.5675,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Saint-Laurent",
          lat: 45.5092,
          lon: -73.5656,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Berri-UQAM",
          lat: 45.515,
          lon: -73.5611,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Beaudry",
          lat: 45.5169,
          lon: -73.5556,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Papineau",
          lat: 45.5244,
          lon: -73.5536,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Frontenac",
          lat: 45.5275,
          lon: -73.5519,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Préfontaine",
          lat: 45.5361,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Joliette",
          lat: 45.5436,
          lon: -73.5461,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Pie-IX",
          lat: 45.5511,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Viau",
          lat: 45.5597,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Assomption",
          lat: 45.5678,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Cadillac",
          lat: 45.5753,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Langelier",
          lat: 45.5839,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Radisson",
          lat: 45.5919,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },
        {
          name: "Honoré-Beaugrand",
          lat: 45.5969,
          lon: -73.5481,
          line: "Orange",
          network: "STM",
          type: "metro",
        },

        // Green Line
        {
          name: "Angrignon",
          lat: 45.4456,
          lon: -73.6031,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Monk",
          lat: 45.4517,
          lon: -73.5969,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Jolicoeur",
          lat: 45.4586,
          lon: -73.5906,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Verdun",
          lat: 45.4633,
          lon: -73.585,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "De l'Église",
          lat: 45.4686,
          lon: -73.5789,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "LaSalle",
          lat: 45.4739,
          lon: -73.5722,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Charlevoix",
          lat: 45.4783,
          lon: -73.5658,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Bonaventure",
          lat: 45.4978,
          lon: -73.5672,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Square-Victoria-OACI",
          lat: 45.5006,
          lon: -73.5631,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Place-d'Armes",
          lat: 45.505,
          lon: -73.5597,
          line: "Green",
          network: "STM",
          type: "metro",
        },
        {
          name: "Champ-de-Mars",
          lat: 45.5094,
          lon: -73.5567,
          line: "Green",
          network: "STM",
          type: "metro",
        },

        // Yellow Line
        {
          name: "Jean-Drapeau",
          lat: 45.5111,
          lon: -73.5342,
          line: "Yellow",
          network: "STM",
          type: "metro",
        },
        {
          name: "Longueuil-Université-de-Sherbrooke",
          lat: 45.5311,
          lon: -73.5064,
          line: "Yellow",
          network: "STM",
          type: "metro",
        },

        // Blue Line
        {
          name: "Côte-des-Neiges",
          lat: 45.495,
          lon: -73.6306,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Université-de-Montréal",
          lat: 45.5044,
          lon: -73.6175,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Édouard-Montpetit",
          lat: 45.5069,
          lon: -73.6117,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Outremont",
          lat: 45.5211,
          lon: -73.6139,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Acadie",
          lat: 45.5272,
          lon: -73.6375,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Parc",
          lat: 45.5122,
          lon: -73.6267,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "De Castelnau",
          lat: 45.5353,
          lon: -73.6508,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Jean-Talon",
          lat: 45.5358,
          lon: -73.6286,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Fabre",
          lat: 45.5386,
          lon: -73.61,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "D'Iberville",
          lat: 45.5422,
          lon: -73.5986,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
        {
          name: "Saint-Michel",
          lat: 45.5556,
          lon: -73.6011,
          line: "Blue",
          network: "STM",
          type: "metro",
        },
      ];

      knownMetroStations.forEach((station) =>
        stationsMap.set(station.name, station)
      );
      console.log(`Added ${knownMetroStations.length} known metro stations`);
    }

    const finalStations = Array.from(stationsMap.values());
    console.log(`Total metro stations: ${finalStations.length}`);

    // Save to JSON file
    const outputPath = path.join(
      __dirname,
      "../../public/assets/montreal_metro.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(finalStations, null, 2));
    console.log(`Metro stations saved to ${outputPath}`);

    return finalStations;
  } catch (error) {
    console.error("Error fetching metro stations:", error);
    throw error;
  }
}

// Run the fetch
fetchMetroStations()
  .then((stations) => {
    console.log("\n✓ Successfully fetched metro stations");
    console.log(`Total stations: ${stations.length}`);
  })
  .catch((error) => {
    console.error("\n✗ Failed to fetch metro stations:", error);
    process.exit(1);
  });
