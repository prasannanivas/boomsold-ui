const fs = require("fs");
const path = require("path");

// Fetch Montreal daycares from Overpass API
async function fetchDaycares() {
  const overpassUrl = "https://overpass-api.de/api/interpreter";

  // Query for daycares in Montreal area
  const query = `
    [out:json][timeout:25];
    // Montreal area bounds
    (
      node["amenity"="kindergarten"](45.3,-74.1,45.8,-73.3);
      node["amenity"="childcare"](45.3,-74.1,45.8,-73.3);
      way["amenity"="kindergarten"](45.3,-74.1,45.8,-73.3);
      way["amenity"="childcare"](45.3,-74.1,45.8,-73.3);
    );
    out center;
    >;
    out skel qt;
  `;

  try {
    console.log("Fetching Montreal daycares...");

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
    console.log(`Found ${data.elements.length} daycare elements`);

    // Process and deduplicate daycares
    const daycaresMap = new Map();

    data.elements.forEach((element) => {
      if (
        element.tags &&
        (element.tags.amenity === "kindergarten" ||
          element.tags.amenity === "childcare")
      ) {
        const name =
          element.tags.name ||
          element.tags["name:fr"] ||
          element.tags["name:en"];

        // Get coordinates - handle both nodes and ways
        let lat, lon;
        if (element.type === "node") {
          lat = element.lat;
          lon = element.lon;
        } else if (element.type === "way" && element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        }

        if (lat && lon) {
          const key = name || `${lat.toFixed(5)}_${lon.toFixed(5)}`;

          // Use key to avoid duplicates
          if (!daycaresMap.has(key)) {
            daycaresMap.set(key, {
              name: name || "Daycare",
              lat: lat,
              lon: lon,
              type:
                element.tags.amenity === "kindergarten"
                  ? "kindergarten"
                  : "childcare",
              address: element.tags["addr:street"] || "",
              phone: element.tags.phone || "",
              website: element.tags.website || "",
            });
          }
        }
      }
    });

    const daycares = Array.from(daycaresMap.values());
    console.log(`Processed ${daycares.length} unique daycares`);

    // Save to JSON file
    const outputPath = path.join(
      __dirname,
      "../../public/assets/montreal_daycares.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(daycares, null, 2));
    console.log(`Daycares saved to ${outputPath}`);

    return daycares;
  } catch (error) {
    console.error("Error fetching daycares:", error);
    throw error;
  }
}

// Run the fetch
fetchDaycares()
  .then((daycares) => {
    console.log("\n✓ Successfully fetched daycares");
    console.log(`Total daycares: ${daycares.length}`);
  })
  .catch((error) => {
    console.error("\n✗ Failed to fetch daycares:", error);
    process.exit(1);
  });
