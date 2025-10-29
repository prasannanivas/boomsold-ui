// Enhanced Fetch with ALL Walk Score API data including Transit & Bike details
// Run: node src/scripts/fetchEnhancedWalkScores.js

const fs = require("fs");
const path = require("path");
const https = require("https");

const WALKSCORE_API_KEY = "d9b403ccf5205722332f9548756ba571";

// Montreal neighborhood coordinates (approximate centers)
const neighborhoodCenters = {
  "Ahuntsic-Cartierville": {
    lat: 45.5578,
    lng: -73.7041,
    address: "Ahuntsic-Cartierville, Montreal, QC",
  },
  Anjou: { lat: 45.6139, lng: -73.5611, address: "Anjou, Montreal, QC" },
  "Baie-D'Urfé": { lat: 45.4167, lng: -73.9167, address: "Baie-D'Urfé, QC" },
  Beaconsfield: { lat: 45.4333, lng: -73.8667, address: "Beaconsfield, QC" },
  "Côte-des-Neiges-Notre-Dame-de-Grâce": {
    lat: 45.4789,
    lng: -73.6239,
    address: "Côte-des-Neiges, Montreal, QC",
  },
  "Côte-Saint-Luc": {
    lat: 45.4667,
    lng: -73.6667,
    address: "Côte-Saint-Luc, QC",
  },
  "Dollard-Des Ormeaux": {
    lat: 45.4833,
    lng: -73.8,
    address: "Dollard-Des Ormeaux, QC",
  },
  Dorval: { lat: 45.45, lng: -73.75, address: "Dorval, QC" },
  Hampstead: { lat: 45.4833, lng: -73.6333, address: "Hampstead, QC" },
  Kirkland: { lat: 45.45, lng: -73.8667, address: "Kirkland, QC" },
  Lachine: { lat: 45.4333, lng: -73.6667, address: "Lachine, Montreal, QC" },
  LaSalle: { lat: 45.4167, lng: -73.6333, address: "LaSalle, Montreal, QC" },
  "Le Plateau-Mont-Royal": {
    lat: 45.5289,
    lng: -73.5764,
    address: "Plateau Mont-Royal, Montreal, QC",
  },
  "Le Sud-Ouest": {
    lat: 45.4667,
    lng: -73.5833,
    address: "Le Sud-Ouest, Montreal, QC",
  },
  "L'Île-Bizard-Sainte-Geneviève": {
    lat: 45.5,
    lng: -73.9,
    address: "L'Île-Bizard, Montreal, QC",
  },
  "Mercier-Hochelaga-Maisonneuve": {
    lat: 45.5889,
    lng: -73.5411,
    address: "Mercier-Hochelaga-Maisonneuve, Montreal, QC",
  },
  "Montréal-Est": { lat: 45.6333, lng: -73.5, address: "Montréal-Est, QC" },
  "Mont-Royal": { lat: 45.5167, lng: -73.6333, address: "Mont-Royal, QC" },
  "Montréal-Nord": {
    lat: 45.6089,
    lng: -73.6289,
    address: "Montréal-Nord, Montreal, QC",
  },
  "Montreal West": { lat: 45.4667, lng: -73.65, address: "Montreal West, QC" },
  Outremont: {
    lat: 45.5189,
    lng: -73.6078,
    address: "Outremont, Montreal, QC",
  },
  "Pointe-Claire": { lat: 45.45, lng: -73.8167, address: "Pointe-Claire, QC" },
  "Pierrefonds-Roxboro": {
    lat: 45.4833,
    lng: -73.85,
    address: "Pierrefonds-Roxboro, Montreal, QC",
  },
  "Rivière-des-Prairies-Pointe-aux-Trembles": {
    lat: 45.6589,
    lng: -73.5439,
    address: "Rivière-des-Prairies, Montreal, QC",
  },
  "Rosemont-La Petite-Patrie": {
    lat: 45.5489,
    lng: -73.5989,
    address: "Rosemont, Montreal, QC",
  },
  "Saint-Laurent": {
    lat: 45.5167,
    lng: -73.6833,
    address: "Saint-Laurent, Montreal, QC",
  },
  "Montréal (Saint-Laurent)": {
    lat: 45.5167,
    lng: -73.6833,
    address: "Saint-Laurent, Montreal, QC",
  },
  "Saint-Léonard": {
    lat: 45.5889,
    lng: -73.5989,
    address: "Saint-Léonard, Montreal, QC",
  },
  "Sainte-Anne-de-Bellevue": {
    lat: 45.4,
    lng: -73.95,
    address: "Sainte-Anne-de-Bellevue, QC",
  },
  Senneville: { lat: 45.4167, lng: -73.9333, address: "Senneville, QC" },
  Verdun: { lat: 45.4578, lng: -73.5678, address: "Verdun, Montreal, QC" },
  "Ville-Marie": {
    lat: 45.5089,
    lng: -73.5617,
    address: "Downtown Montreal, QC",
  },
  "Villeray-Saint-Michel-Parc-Extension": {
    lat: 45.5589,
    lng: -73.6189,
    address: "Villeray, Montreal, QC",
  },
  Westmount: { lat: 45.4833, lng: -73.6, address: "Westmount, QC" },
};

// Fetch Walk Score with FULL transit and bike details
function fetchEnhancedWalkScore(lat, lng, address) {
  return new Promise((resolve, reject) => {
    // Add transit=1 and bike=1 to get detailed transit and bike information
    const url = `https://api.walkscore.com/score?format=json&lat=${lat}&lon=${lng}&address=${encodeURIComponent(
      address
    )}&transit=1&bike=1&wsapikey=${WALKSCORE_API_KEY}`;

    https
      .get(url, (res) => {
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
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// Get description based on walk score
function getDescription(walkScore) {
  if (walkScore >= 90)
    return "Walker's Paradise - Daily errands do not require a car";
  if (walkScore >= 70)
    return "Very Walkable - Most errands can be accomplished on foot";
  if (walkScore >= 50)
    return "Somewhat Walkable - Some errands can be accomplished on foot";
  if (walkScore >= 25) return "Car-Dependent - Most errands require a car";
  return "Car-Dependent - Almost all errands require a car";
}

// Main function
async function fetchAllEnhancedScores() {
  console.log(
    "🚀 Fetching ENHANCED Walk Scores (with Transit & Bike Details)...\n"
  );
  console.log("API Key:", WALKSCORE_API_KEY);
  console.log("Total neighborhoods:", Object.keys(neighborhoodCenters).length);
  console.log("Rate limit: 5 requests/second");
  console.log("Extra data: ✅ Transit routes ✅ Bike details\n");
  console.log("═".repeat(80));
  console.log("\n");

  const results = {};
  const neighborhoods = Object.entries(neighborhoodCenters);
  let successCount = 0;
  let errorCount = 0;
  let transitDataCount = 0;
  let bikeDataCount = 0;

  for (let i = 0; i < neighborhoods.length; i++) {
    const [name, location] = neighborhoods[i];

    try {
      console.log(`[${i + 1}/${neighborhoods.length}] Fetching: ${name}...`);

      const data = await fetchEnhancedWalkScore(
        location.lat,
        location.lng,
        location.address
      );

      if (data.status === 1) {
        const walkScore = data.walkscore;
        const transitInfo = data.transit || null;
        const bikeInfo = data.bike || null;

        // Extract transit details
        let transitScore = null;
        let transitSummary = null;
        let transitDescription = null;

        if (transitInfo) {
          transitScore = transitInfo.score;
          transitSummary = transitInfo.summary;
          transitDescription = transitInfo.description;
          transitDataCount++;
        }

        // Extract bike details
        let bikeScore = null;
        let bikeDescription = null;

        if (bikeInfo) {
          bikeScore = bikeInfo.score;
          bikeDescription = bikeInfo.description;
          bikeDataCount++;
        }

        // Calculate accessibility as composite
        const finalTransitScore = transitScore || Math.floor(walkScore * 0.85);
        const finalBikeScore = bikeScore || Math.floor(walkScore * 0.9);
        const accessibilityScore = Math.floor(
          walkScore * 0.4 + finalTransitScore * 0.35 + finalBikeScore * 0.25
        );

        results[name] = {
          walkScore: walkScore,
          transitScore: finalTransitScore,
          bikeScore: finalBikeScore,
          accessibilityScore: accessibilityScore,
          description: data.description || getDescription(walkScore),

          // Enhanced transit information
          transitDetails: transitInfo
            ? {
                score: transitInfo.score,
                description: transitInfo.description,
                summary: transitInfo.summary,
              }
            : null,

          // Enhanced bike information
          bikeDetails: bikeInfo
            ? {
                score: bikeInfo.score,
                description: bikeInfo.description,
              }
            : null,

          // Full API response for reference
          apiResponse: {
            status: data.status,
            walkscore: data.walkscore,
            updated: data.updated || "N/A",
            logo_url: data.logo_url,
            more_info_icon: data.more_info_icon,
            more_info_link: data.more_info_link,
            help_link: data.help_link,
            snapped_lat: data.snapped_lat,
            snapped_lon: data.snapped_lon,
            ws_link: data.ws_link,
          },
        };

        console.log(
          `   ✅ Walk: ${walkScore} | Transit: ${finalTransitScore}${
            transitInfo ? " (detailed)" : ""
          } | Bike: ${finalBikeScore}${bikeInfo ? " (detailed)" : ""}`
        );
        if (transitSummary) {
          console.log(`   🚌 Transit: ${transitSummary}`);
        }
        if (bikeDescription) {
          console.log(`   🚴 Bike: ${bikeDescription}`);
        }
        console.log(`   📝 ${results[name].description}\n`);
        successCount++;
      } else {
        console.log(`   ⚠️  API returned status ${data.status}\n`);
        errorCount++;

        results[name] = {
          walkScore: 60,
          transitScore: 65,
          bikeScore: 58,
          accessibilityScore: 62,
          description: "Score not available from API",
          transitDetails: null,
          bikeDetails: null,
          apiResponse: { status: data.status, error: true },
        };
      }

      // Rate limiting: 250ms between requests
      if (i < neighborhoods.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      errorCount++;

      results[name] = {
        walkScore: 60,
        transitScore: 65,
        bikeScore: 58,
        accessibilityScore: 62,
        description: "Error fetching from API",
        transitDetails: null,
        bikeDetails: null,
        error: error.message,
      };
    }
  }

  console.log("\n" + "═".repeat(80));
  console.log(`\n✅ Successfully fetched: ${successCount} neighborhoods`);
  console.log(
    `🚌 Transit details available: ${transitDataCount} neighborhoods`
  );
  console.log(`🚴 Bike details available: ${bikeDataCount} neighborhoods`);
  console.log(`❌ Errors: ${errorCount} neighborhoods`);
  console.log(`📊 Total processed: ${Object.keys(results).length}\n`);

  // Save enhanced data to JSON file
  const outputPath = path.join(__dirname, "../data/enhancedWalkScores.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Enhanced data saved to: ${outputPath}\n`);

  // Generate summary report
  console.log("\n📊 ENHANCED DATA SUMMARY:\n");

  // Best transit neighborhoods
  console.log("🚌 TOP 5 BEST TRANSIT NEIGHBORHOODS:\n");
  const sortedByTransit = Object.entries(results)
    .filter(([_, data]) => data.transitDetails)
    .sort((a, b) => b[1].transitScore - a[1].transitScore)
    .slice(0, 5);

  sortedByTransit.forEach(([name, data], index) => {
    console.log(
      `${index + 1}. ${name.padEnd(40)} Transit: ${data.transitScore}`
    );
    if (data.transitDetails?.summary) {
      console.log(`   ${data.transitDetails.summary}`);
    }
  });

  // Best bike neighborhoods
  console.log("\n\n🚴 TOP 5 BEST BIKE NEIGHBORHOODS:\n");
  const sortedByBike = Object.entries(results)
    .filter(([_, data]) => data.bikeDetails)
    .sort((a, b) => b[1].bikeScore - a[1].bikeScore)
    .slice(0, 5);

  sortedByBike.forEach(([name, data], index) => {
    console.log(`${index + 1}. ${name.padEnd(40)} Bike: ${data.bikeScore}`);
    if (data.bikeDetails?.description) {
      console.log(`   ${data.bikeDetails.description}`);
    }
  });

  console.log(
    "\n✨ Done! Enhanced Walk Scores with transit & bike details saved.\n"
  );
}

// Run the script
fetchAllEnhancedScores().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
