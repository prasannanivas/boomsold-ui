// Fetch Real Walk Scores from Walk Score API and save to file
// Run: node src/scripts/fetchRealWalkScores.js

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

// Fetch Walk Score from API
function fetchWalkScore(lat, lng, address) {
  return new Promise((resolve, reject) => {
    const url = `https://api.walkscore.com/score?format=json&lat=${lat}&lon=${lng}&address=${encodeURIComponent(
      address
    )}&wsapikey=${WALKSCORE_API_KEY}`;

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
async function fetchAllScores() {
  console.log("🚀 Fetching REAL Walk Scores from Walk Score API...\n");
  console.log("API Key:", WALKSCORE_API_KEY);
  console.log("Total neighborhoods:", Object.keys(neighborhoodCenters).length);
  console.log("Rate limit: 5 requests/second\n");
  console.log("═".repeat(80));
  console.log("\n");

  const results = {};
  const neighborhoods = Object.entries(neighborhoodCenters);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < neighborhoods.length; i++) {
    const [name, location] = neighborhoods[i];

    try {
      console.log(`[${i + 1}/${neighborhoods.length}] Fetching: ${name}...`);

      const data = await fetchWalkScore(
        location.lat,
        location.lng,
        location.address
      );

      if (data.status === 1) {
        const walkScore = data.walkscore;
        const transitScore = data.transit?.score || null;
        const bikeScore = data.bike?.score || null;

        // Calculate accessibility as composite
        const accessibilityScore =
          transitScore && bikeScore
            ? Math.floor(
                walkScore * 0.4 + transitScore * 0.35 + bikeScore * 0.25
              )
            : Math.floor(
                walkScore * 0.7 + (transitScore || walkScore * 0.9) * 0.3
              );

        results[name] = {
          walkScore: walkScore,
          transitScore: transitScore || Math.floor(walkScore * 0.85), // Estimate if missing
          bikeScore: bikeScore || Math.floor(walkScore * 0.9), // Estimate if missing
          accessibilityScore: accessibilityScore,
          description: data.description || getDescription(walkScore),
          apiResponse: {
            status: data.status,
            walkscore: data.walkscore,
            updated: data.updated || "N/A",
            logo_url: data.logo_url,
            more_info_icon: data.more_info_icon,
            ws_link: data.ws_link,
          },
        };

        console.log(
          `   ✅ Walk Score: ${walkScore} | Transit: ${results[name].transitScore} | Bike: ${results[name].bikeScore}`
        );
        console.log(`   📝 ${results[name].description}\n`);
        successCount++;
      } else {
        console.log(
          `   ⚠️  API returned status ${data.status} - ${
            data.status === 2 ? "Score being calculated" : "Error"
          }\n`
        );
        errorCount++;

        // Store with fallback values
        results[name] = {
          walkScore: 60,
          transitScore: 65,
          bikeScore: 58,
          accessibilityScore: 62,
          description: "Score not available from API",
          apiResponse: { status: data.status, error: true },
        };
      }

      // Rate limiting: Wait 250ms between requests (4 requests/second, safely under 5/sec limit)
      if (i < neighborhoods.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      errorCount++;

      // Store with fallback values
      results[name] = {
        walkScore: 60,
        transitScore: 65,
        bikeScore: 58,
        accessibilityScore: 62,
        description: "Error fetching from API",
        error: error.message,
      };
    }
  }

  console.log("\n" + "═".repeat(80));
  console.log(`\n✅ Successfully fetched: ${successCount} neighborhoods`);
  console.log(`❌ Errors: ${errorCount} neighborhoods`);
  console.log(`📊 Total processed: ${Object.keys(results).length}\n`);

  // Save to JSON file
  const outputPath = path.join(__dirname, "../data/realWalkScores.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Saved to: ${outputPath}\n`);

  // Also update the walkabilityScores.js file
  const jsOutputPath = path.join(__dirname, "../utils/walkabilityScores.js");
  const jsContent = generateJSFile(results);
  fs.writeFileSync(jsOutputPath, jsContent);
  console.log(`💾 Updated: ${jsOutputPath}\n`);

  // Generate summary
  console.log("\n📈 TOP 10 Most Walkable Neighborhoods:\n");
  const sorted = Object.entries(results)
    .sort((a, b) => b[1].walkScore - a[1].walkScore)
    .slice(0, 10);

  sorted.forEach(([name, data], index) => {
    console.log(
      `${index + 1}. ${name.padEnd(40)} Walk: ${data.walkScore} | Transit: ${
        data.transitScore
      } | Bike: ${data.bikeScore}`
    );
  });

  console.log("\n✨ Done! Real Walk Scores have been fetched and stored.\n");
}

// Generate JavaScript file content
function generateJSFile(results) {
  let content = `// Montreal Neighborhood Walkability and Accessibility Scores
// Generated from Walk Score API on ${new Date().toISOString()}
// API Key: ${WALKSCORE_API_KEY}

export const neighborhoodScores = {\n`;

  Object.entries(results).forEach(([name, data]) => {
    content += `  "${name}": {\n`;
    content += `    walkScore: ${data.walkScore},\n`;
    content += `    transitScore: ${data.transitScore},\n`;
    content += `    bikeScore: ${data.bikeScore},\n`;
    content += `    accessibilityScore: ${data.accessibilityScore},\n`;
    content += `    description: "${data.description}",\n`;
    content += `  },\n`;
  });

  content += `};

// Helper function to get scores for a neighborhood
export const getNeighborhoodScores = (neighborhoodName) => {
  // Try direct match first
  if (neighborhoodScores[neighborhoodName]) {
    return neighborhoodScores[neighborhoodName];
  }

  // Try normalized match (handle variations in naming)
  const normalizedName = neighborhoodName
    .replace(/–/g, "-") // Replace en-dash with hyphen
    .replace(/\\s+/g, " ") // Normalize spaces
    .trim();

  if (neighborhoodScores[normalizedName]) {
    return neighborhoodScores[normalizedName];
  }

  // Try partial match
  const matchKey = Object.keys(neighborhoodScores).find(key => 
    key.toLowerCase().includes(normalizedName.toLowerCase()) ||
    normalizedName.toLowerCase().includes(key.toLowerCase())
  );

  if (matchKey) {
    return neighborhoodScores[matchKey];
  }

  // Default scores if no match found
  return {
    walkScore: 60,
    transitScore: 65,
    bikeScore: 58,
    accessibilityScore: 65,
    description: "Somewhat Walkable - Some errands can be accomplished on foot"
  };
};

// Get color based on walk score
export const getWalkScoreColor = (score) => {
  if (score >= 90) return "#00a65a"; // Green - Walker's Paradise
  if (score >= 70) return "#41c464"; // Light Green - Very Walkable
  if (score >= 50) return "#f39c12"; // Orange - Somewhat Walkable
  if (score >= 25) return "#ff8800"; // Dark Orange - Car-Dependent
  return "#dd4b39"; // Red - Very Car-Dependent
};

// Get walk score category
export const getWalkScoreCategory = (score) => {
  if (score >= 90) return "Walker's Paradise";
  if (score >= 70) return "Very Walkable";
  if (score >= 50) return "Somewhat Walkable";
  if (score >= 25) return "Car-Dependent";
  return "Very Car-Dependent";
};
`;

  return content;
}

// Run the script
fetchAllScores().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
