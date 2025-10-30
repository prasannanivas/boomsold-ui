// Fetch Sports Arenas and Restaurants from OpenStreetMap Overpass API
// Run: node src/scripts/fetchSportsAndRestaurants.js

const fs = require("fs");
const path = require("path");
const https = require("https");

// Montreal bounding box coordinates
// [south, west, north, east]
const MONTREAL_BBOX = "45.4,-73.95,45.71,-73.47";

// Overpass API endpoint
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

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
 * Build Overpass QL query for Sports Arenas
 */
function buildSportsArenaQuery() {
  return `
    [out:json][timeout:60];
    (
      // Sports stadiums and arenas
      node["leisure"="stadium"](${MONTREAL_BBOX});
      way["leisure"="stadium"](${MONTREAL_BBOX});
      relation["leisure"="stadium"](${MONTREAL_BBOX});
      
      // Sports centres
      node["leisure"="sports_centre"](${MONTREAL_BBOX});
      way["leisure"="sports_centre"](${MONTREAL_BBOX});
      relation["leisure"="sports_centre"](${MONTREAL_BBOX});
      
      // Ice rinks and hockey arenas
      node["leisure"="ice_rink"](${MONTREAL_BBOX});
      way["leisure"="ice_rink"](${MONTREAL_BBOX});
      relation["leisure"="ice_rink"](${MONTREAL_BBOX});
      
      // Fitness centres
      node["leisure"="fitness_centre"](${MONTREAL_BBOX});
      way["leisure"="fitness_centre"](${MONTREAL_BBOX});
      
      // Swimming pools
      node["leisure"="swimming_pool"](${MONTREAL_BBOX});
      way["leisure"="swimming_pool"](${MONTREAL_BBOX});
      
      // Sports halls
      node["building"="sports_hall"](${MONTREAL_BBOX});
      way["building"="sports_hall"](${MONTREAL_BBOX});
      
      // Tracks and pitches
      node["leisure"="track"](${MONTREAL_BBOX});
      way["leisure"="track"](${MONTREAL_BBOX});
      node["leisure"="pitch"](${MONTREAL_BBOX});
      way["leisure"="pitch"](${MONTREAL_BBOX});
    );
    out center;
  `;
}

/**
 * Build Overpass QL query for Restaurants
 */
function buildRestaurantQuery() {
  return `
    [out:json][timeout:60];
    (
      // Restaurants
      node["amenity"="restaurant"](${MONTREAL_BBOX});
      way["amenity"="restaurant"](${MONTREAL_BBOX});
      relation["amenity"="restaurant"](${MONTREAL_BBOX});
      
      // Fast food
      node["amenity"="fast_food"](${MONTREAL_BBOX});
      way["amenity"="fast_food"](${MONTREAL_BBOX});
      
      // Cafes
      node["amenity"="cafe"](${MONTREAL_BBOX});
      way["amenity"="cafe"](${MONTREAL_BBOX});
      
      // Food courts
      node["amenity"="food_court"](${MONTREAL_BBOX});
      way["amenity"="food_court"](${MONTREAL_BBOX});
      
      // Bars and pubs
      node["amenity"="bar"](${MONTREAL_BBOX});
      way["amenity"="bar"](${MONTREAL_BBOX});
      node["amenity"="pub"](${MONTREAL_BBOX});
      way["amenity"="pub"](${MONTREAL_BBOX});
      
      // Biergartens
      node["amenity"="biergarten"](${MONTREAL_BBOX});
      way["amenity"="biergarten"](${MONTREAL_BBOX});
    );
    out center;
  `;
}

/**
 * Process and format POI data
 */
function formatPOIData(data, type) {
  const formattedData = {
    type: type,
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
        tags: element.tags || {},
        name: element.tags?.name || "Unnamed",
        // Additional helpful fields
        address: buildAddress(element.tags),
        category: element.tags?.leisure || element.tags?.amenity || type,
        sport: element.tags?.sport || null,
        cuisine: element.tags?.cuisine || null,
        website: element.tags?.website || null,
        phone: element.tags?.phone || null,
        openingHours: element.tags?.opening_hours || null,
      };
    }),
  };

  return formattedData;
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
 * Generate summary statistics
 */
function generateSummary(sportsData, restaurantData) {
  console.log("\n" + "═".repeat(80));
  console.log("\n📊 SUMMARY STATISTICS\n");
  console.log("═".repeat(80));

  // Sports Arenas
  console.log("\n🏟️  SPORTS ARENAS:");
  console.log(`   Total: ${sportsData.count}`);

  const sportsByType = {};
  sportsData.elements.forEach((element) => {
    const category = element.category;
    sportsByType[category] = (sportsByType[category] || 0) + 1;
  });

  Object.entries(sportsByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

  // Restaurants
  console.log("\n🍽️  RESTAURANTS & DINING:");
  console.log(`   Total: ${restaurantData.count}`);

  const restaurantsByType = {};
  restaurantData.elements.forEach((element) => {
    const category = element.category;
    restaurantsByType[category] = (restaurantsByType[category] || 0) + 1;
  });

  Object.entries(restaurantsByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

  // Top cuisines
  console.log("\n🍜 TOP CUISINES:");
  const cuisines = {};
  restaurantData.elements.forEach((element) => {
    if (element.cuisine) {
      const cuisineList = element.cuisine.split(";");
      cuisineList.forEach((c) => {
        const cuisine = c.trim();
        cuisines[cuisine] = (cuisines[cuisine] || 0) + 1;
      });
    }
  });

  Object.entries(cuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cuisine, count], index) => {
      console.log(`   ${index + 1}. ${cuisine}: ${count}`);
    });

  // Top sports
  console.log("\n⚽ TOP SPORTS:");
  const sports = {};
  sportsData.elements.forEach((element) => {
    if (element.sport) {
      const sportList = element.sport.split(";");
      sportList.forEach((s) => {
        const sport = s.trim();
        sports[sport] = (sports[sport] || 0) + 1;
      });
    }
  });

  Object.entries(sports)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([sport, count], index) => {
      console.log(`   ${index + 1}. ${sport}: ${count}`);
    });

  console.log("\n" + "═".repeat(80) + "\n");
}

/**
 * Main function
 */
async function fetchAllPOIs() {
  console.log("═".repeat(80));
  console.log("🚀 Fetching Sports Arenas and Restaurants from OSM");
  console.log("═".repeat(80));
  console.log(`\nBounding Box: ${MONTREAL_BBOX}`);
  console.log(`API: ${OVERPASS_API}\n`);

  try {
    // Fetch Sports Arenas
    console.log("🏟️  Fetching Sports Arenas...");
    const sportsQuery = buildSportsArenaQuery();
    const sportsRawData = await fetchOverpassData(sportsQuery);
    const sportsData = formatPOIData(sportsRawData, "sports");
    console.log(`   ✅ Found ${sportsData.count} sports facilities\n`);

    // Wait a bit to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch Restaurants
    console.log("🍽️  Fetching Restaurants & Dining...");
    const restaurantQuery = buildRestaurantQuery();
    const restaurantRawData = await fetchOverpassData(restaurantQuery);
    const restaurantData = formatPOIData(restaurantRawData, "restaurant");
    console.log(`   ✅ Found ${restaurantData.count} dining locations\n`);

    // Save individual files
    const sportsPath = path.join(
      __dirname,
      "../../public/assets/montreal_sports.json"
    );
    const restaurantPath = path.join(
      __dirname,
      "../../public/assets/montreal_restaurants.json"
    );

    fs.writeFileSync(sportsPath, JSON.stringify(sportsData, null, 2));
    console.log(`💾 Sports arenas saved to: ${sportsPath}`);

    fs.writeFileSync(restaurantPath, JSON.stringify(restaurantData, null, 2));
    console.log(`💾 Restaurants saved to: ${restaurantPath}`);

    // Read existing POIs file
    const poisPath = path.join(
      __dirname,
      "../../public/assets/montreal_pois.json"
    );

    let existingPOIs = { elements: [] };
    if (fs.existsSync(poisPath)) {
      console.log("\n📂 Reading existing POIs file...");
      existingPOIs = JSON.parse(fs.readFileSync(poisPath, "utf-8"));
    }

    // Merge with existing data
    console.log("🔄 Merging with existing POIs...");

    // Create a Set of existing IDs to avoid duplicates
    const existingIds = new Set(existingPOIs.elements.map((e) => e.id));

    // Add sports arenas (with sport_facility tag)
    let sportsAdded = 0;
    sportsData.elements.forEach((element) => {
      if (!existingIds.has(element.id)) {
        existingPOIs.elements.push({
          ...element,
          poi_type: "sport_facility",
        });
        existingIds.add(element.id);
        sportsAdded++;
      }
    });

    // Add restaurants (with restaurant tag)
    let restaurantsAdded = 0;
    restaurantData.elements.forEach((element) => {
      if (!existingIds.has(element.id)) {
        existingPOIs.elements.push({
          ...element,
          poi_type: "restaurant",
        });
        existingIds.add(element.id);
        restaurantsAdded++;
      }
    });

    // Update metadata
    existingPOIs.lastUpdated = new Date().toISOString();
    existingPOIs.totalCount = existingPOIs.elements.length;

    // Save merged POIs
    fs.writeFileSync(poisPath, JSON.stringify(existingPOIs, null, 2));
    console.log(`💾 Updated POIs file: ${poisPath}`);
    console.log(`   Added ${sportsAdded} sports facilities`);
    console.log(`   Added ${restaurantsAdded} dining locations`);
    console.log(`   Total POIs: ${existingPOIs.totalCount}`);

    // Generate summary
    generateSummary(sportsData, restaurantData);

    console.log("✨ Done! Sports arenas and restaurants have been fetched.\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
fetchAllPOIs().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
