// Comprehensive POI Fetcher - Fetch all types of POIs from OpenStreetMap
// Run: node src/scripts/fetchAllPOIs.js [--type=sports|restaurants|all]

const fs = require("fs");
const path = require("path");
const https = require("https");

// Montreal bounding box coordinates [south, west, north, east]
const MONTREAL_BBOX = "45.4,-73.95,45.71,-73.47";
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

// Parse command line arguments
const args = process.argv.slice(2);
const typeArg = args.find((arg) => arg.startsWith("--type="));
const fetchType = typeArg ? typeArg.split("=")[1] : "all";

/**
 * POI Categories Configuration
 */
const POI_CATEGORIES = {
  sports: {
    name: "Sports & Fitness",
    icon: "🏟️",
    queries: [
      'node["leisure"="stadium"]',
      'way["leisure"="stadium"]',
      'node["leisure"="sports_centre"]',
      'way["leisure"="sports_centre"]',
      'node["leisure"="ice_rink"]',
      'way["leisure"="ice_rink"]',
      'node["leisure"="fitness_centre"]',
      'way["leisure"="fitness_centre"]',
      'node["leisure"="swimming_pool"]',
      'way["leisure"="swimming_pool"]',
      'node["building"="sports_hall"]',
      'way["building"="sports_hall"]',
      'node["leisure"="track"]',
      'way["leisure"="track"]',
      'node["leisure"="pitch"]',
      'way["leisure"="pitch"]',
      'node["leisure"="golf_course"]',
      'way["leisure"="golf_course"]',
    ],
  },

  restaurants: {
    name: "Restaurants & Dining",
    icon: "🍽️",
    queries: [
      'node["amenity"="restaurant"]',
      'way["amenity"="restaurant"]',
      'node["amenity"="fast_food"]',
      'way["amenity"="fast_food"]',
      'node["amenity"="cafe"]',
      'way["amenity"="cafe"]',
      'node["amenity"="food_court"]',
      'way["amenity"="food_court"]',
      'node["amenity"="bar"]',
      'way["amenity"="bar"]',
      'node["amenity"="pub"]',
      'way["amenity"="pub"]',
      'node["amenity"="biergarten"]',
      'way["amenity"="biergarten"]',
    ],
  },

  parks: {
    name: "Parks & Recreation",
    icon: "🌳",
    queries: [
      'node["leisure"="park"]',
      'way["leisure"="park"]',
      'relation["leisure"="park"]',
      'node["leisure"="garden"]',
      'way["leisure"="garden"]',
      'node["leisure"="nature_reserve"]',
      'way["leisure"="nature_reserve"]',
    ],
  },

  hospitals: {
    name: "Healthcare Facilities",
    icon: "🏥",
    queries: [
      'node["amenity"="hospital"]',
      'way["amenity"="hospital"]',
      'node["amenity"="clinic"]',
      'way["amenity"="clinic"]',
      'node["healthcare"="hospital"]',
      'way["healthcare"="hospital"]',
    ],
  },

  schools: {
    name: "Educational Institutions",
    icon: "🎓",
    queries: [
      'node["amenity"="school"]',
      'way["amenity"="school"]',
      'node["amenity"="college"]',
      'way["amenity"="college"]',
      'node["amenity"="university"]',
      'way["amenity"="university"]',
    ],
  },
};

/**
 * Fetch POIs from Overpass API
 */
function fetchOverpassData(query) {
  return new Promise((resolve, reject) => {
    const postData = `data=${encodeURIComponent(query)}`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(OVERPASS_API, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Build Overpass QL query for a category
 */
function buildQuery(category) {
  const config = POI_CATEGORIES[category];
  const queries = config.queries
    .map((q) => `${q}(${MONTREAL_BBOX})`)
    .join(";\n      ");

  return `
    [out:json][timeout:90];
    (
      ${queries};
    );
    out center;
  `;
}

/**
 * Build address from tags
 */
function buildAddress(tags) {
  if (!tags) return null;

  const parts = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);

  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Process and format POI data
 */
function formatPOIData(data, category) {
  return {
    type: category,
    fetchDate: new Date().toISOString(),
    count: data.elements.length,
    elements: data.elements.map((element) => {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      return {
        id: element.id,
        type: element.type,
        lat: lat,
        lon: lon,
        poi_type: category,
        tags: element.tags || {},
        name: element.tags?.name || "Unnamed",
        address: buildAddress(element.tags),
        category: element.tags?.leisure || element.tags?.amenity || category,
        sport: element.tags?.sport || null,
        cuisine: element.tags?.cuisine || null,
        website: element.tags?.website || null,
        phone: element.tags?.phone || null,
        openingHours: element.tags?.opening_hours || null,
      };
    }),
  };
}

/**
 * Fetch POIs for a specific category
 */
async function fetchCategory(category) {
  const config = POI_CATEGORIES[category];
  console.log(`\n${config.icon} Fetching ${config.name}...`);

  try {
    const query = buildQuery(category);
    const rawData = await fetchOverpassData(query);
    const formattedData = formatPOIData(rawData, category);

    console.log(`   ✅ Found ${formattedData.count} items`);

    // Save individual category file
    const categoryPath = path.join(
      __dirname,
      `../../public/assets/montreal_${category}.json`
    );
    fs.writeFileSync(categoryPath, JSON.stringify(formattedData, null, 2));
    console.log(`   💾 Saved to: ${categoryPath}`);

    return formattedData;
  } catch (error) {
    console.error(`   ❌ Error fetching ${category}:`, error.message);
    return null;
  }
}

/**
 * Generate comprehensive summary
 */
function generateSummary(allData) {
  console.log("\n" + "═".repeat(80));
  console.log("📊 COMPREHENSIVE POI SUMMARY");
  console.log("═".repeat(80));

  let totalPOIs = 0;

  Object.entries(allData).forEach(([category, data]) => {
    if (data) {
      const config = POI_CATEGORIES[category];
      console.log(`\n${config.icon} ${config.name.toUpperCase()}:`);
      console.log(`   Total: ${data.count}`);
      totalPOIs += data.count;

      // Count by subcategory
      const subcategories = {};
      data.elements.forEach((element) => {
        const subcat = element.category;
        subcategories[subcat] = (subcategories[subcat] || 0) + 1;
      });

      Object.entries(subcategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([subcat, count]) => {
          console.log(`   - ${subcat}: ${count}`);
        });
    }
  });

  console.log(`\n${"═".repeat(80)}`);
  console.log(`📍 TOTAL POIs ACROSS ALL CATEGORIES: ${totalPOIs}`);
  console.log(`${"═".repeat(80)}\n`);
}

/**
 * Main function
 */
async function fetchAllPOIs() {
  console.log("═".repeat(80));
  console.log("🚀 COMPREHENSIVE POI FETCHER FOR MONTREAL");
  console.log("═".repeat(80));
  console.log(`\nFetch Type: ${fetchType.toUpperCase()}`);
  console.log(`Bounding Box: ${MONTREAL_BBOX}`);
  console.log(`API: ${OVERPASS_API}\n`);

  try {
    const allData = {};
    const categoriesToFetch =
      fetchType === "all" ? Object.keys(POI_CATEGORIES) : [fetchType];

    // Validate fetch type
    if (fetchType !== "all" && !POI_CATEGORIES[fetchType]) {
      console.error(
        `❌ Invalid type: ${fetchType}. Valid options: ${Object.keys(
          POI_CATEGORIES
        ).join(", ")}, all`
      );
      process.exit(1);
    }

    // Fetch each category
    for (const category of categoriesToFetch) {
      const data = await fetchCategory(category);
      if (data) {
        allData[category] = data;
      }

      // Be nice to the API - wait between requests
      if (category !== categoriesToFetch[categoriesToFetch.length - 1]) {
        console.log("   ⏳ Waiting 3 seconds before next request...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Merge all data into the main POIs file
    console.log("\n🔄 Merging all POIs into main file...");

    const poisPath = path.join(
      __dirname,
      "../../public/assets/montreal_pois.json"
    );

    let mergedPOIs = {
      version: "2.0",
      generator: "Custom POI Fetcher",
      fetchDate: new Date().toISOString(),
      bbox: MONTREAL_BBOX,
      categories: categoriesToFetch,
      elements: [],
    };

    // Read existing POIs if available
    if (fs.existsSync(poisPath)) {
      console.log("   📂 Reading existing POIs file...");
      const existing = JSON.parse(fs.readFileSync(poisPath, "utf-8"));
      if (existing.elements) {
        mergedPOIs.elements = existing.elements;
      }
    }

    // Track existing IDs
    const existingIds = new Set(mergedPOIs.elements.map((e) => e.id));

    // Merge new data
    let totalAdded = 0;
    Object.entries(allData).forEach(([category, data]) => {
      if (data) {
        let categoryAdded = 0;
        data.elements.forEach((element) => {
          if (!existingIds.has(element.id)) {
            mergedPOIs.elements.push(element);
            existingIds.add(element.id);
            categoryAdded++;
            totalAdded++;
          }
        });
        console.log(`   ✅ Added ${categoryAdded} ${category} items`);
      }
    });

    // Update metadata
    mergedPOIs.lastUpdated = new Date().toISOString();
    mergedPOIs.totalCount = mergedPOIs.elements.length;

    // Save merged file
    fs.writeFileSync(poisPath, JSON.stringify(mergedPOIs, null, 2));
    console.log(`\n💾 Updated main POIs file: ${poisPath}`);
    console.log(`   Added ${totalAdded} new items`);
    console.log(`   Total POIs: ${mergedPOIs.totalCount}`);

    // Generate summary
    generateSummary(allData);

    console.log("✨ Done! All POIs have been fetched and merged.\n");
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
fetchAllPOIs().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
