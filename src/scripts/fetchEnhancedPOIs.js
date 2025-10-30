const https = require("https");
const fs = require("fs");
const path = require("path");

// Montreal bounding box
const MONTREAL_BBOX = "45.4,-73.95,45.71,-73.47"; // south,west,north,east

// Enhanced Overpass API queries with detailed tags
const buildParksQuery = () => {
  return `
    [out:json][timeout:90];
    (
      way["leisure"="park"](${MONTREAL_BBOX});
      relation["leisure"="park"](${MONTREAL_BBOX});
      way["leisure"="garden"](${MONTREAL_BBOX});
      relation["leisure"="garden"](${MONTREAL_BBOX});
      way["leisure"="playground"](${MONTREAL_BBOX});
      node["leisure"="playground"](${MONTREAL_BBOX});
    );
    out center;
    out tags;
  `;
};

const buildSchoolsQuery = () => {
  return `
    [out:json][timeout:90];
    (
      node["amenity"="school"](${MONTREAL_BBOX});
      way["amenity"="school"](${MONTREAL_BBOX});
      relation["amenity"="school"](${MONTREAL_BBOX});
      node["amenity"="college"](${MONTREAL_BBOX});
      way["amenity"="college"](${MONTREAL_BBOX});
      relation["amenity"="college"](${MONTREAL_BBOX});
      node["amenity"="university"](${MONTREAL_BBOX});
      way["amenity"="university"](${MONTREAL_BBOX});
      relation["amenity"="university"](${MONTREAL_BBOX});
    );
    out center;
    out tags;
  `;
};

const buildHospitalsQuery = () => {
  return `
    [out:json][timeout:90];
    (
      node["amenity"="hospital"](${MONTREAL_BBOX});
      way["amenity"="hospital"](${MONTREAL_BBOX});
      relation["amenity"="hospital"](${MONTREAL_BBOX});
      node["amenity"="clinic"](${MONTREAL_BBOX});
      way["amenity"="clinic"](${MONTREAL_BBOX});
      node["healthcare"="hospital"](${MONTREAL_BBOX});
      way["healthcare"="hospital"](${MONTREAL_BBOX});
      node["healthcare"="clinic"](${MONTREAL_BBOX});
      way["healthcare"="clinic"](${MONTREAL_BBOX});
      node["healthcare"="doctor"](${MONTREAL_BBOX});
      way["healthcare"="doctor"](${MONTREAL_BBOX});
    );
    out center;
    out tags;
  `;
};

// Format POI data with detailed information
const formatPOIData = (element, category) => {
  const poi = {
    id: element.id,
    type: element.type,
    lat: element.lat || element.center?.lat,
    lon: element.lon || element.center?.lon,
    category: category,
    name: element.tags?.name || element.tags?.["name:en"] || "Unnamed",
    tags: element.tags,
  };

  // Common fields
  if (element.tags?.["addr:street"] && element.tags?.["addr:housenumber"]) {
    poi.address = `${element.tags["addr:housenumber"]} ${element.tags["addr:street"]}`;
    if (element.tags?.["addr:city"]) {
      poi.address += `, ${element.tags["addr:city"]}`;
    }
  } else if (element.tags?.["addr:street"]) {
    poi.address = element.tags["addr:street"];
  }

  poi.phone = element.tags?.phone || element.tags?.["contact:phone"];
  poi.website =
    element.tags?.website ||
    element.tags?.["contact:website"] ||
    element.tags?.url;
  poi.email = element.tags?.email || element.tags?.["contact:email"];
  poi.openingHours = element.tags?.opening_hours;

  // Category-specific fields
  if (category === "park") {
    poi.parkType = element.tags?.leisure; // park, garden, playground
    poi.access = element.tags?.access;
    poi.operator = element.tags?.operator;
    poi.surface = element.tags?.surface;
    poi.lit = element.tags?.lit; // Is it lit at night?
    poi.description = element.tags?.description;
    poi.facilities = [];
    if (element.tags?.toilets === "yes") poi.facilities.push("toilets");
    if (element.tags?.playground === "yes") poi.facilities.push("playground");
    if (element.tags?.sport)
      poi.facilities.push(`sport: ${element.tags.sport}`);
    if (element.tags?.dog === "yes" || element.tags?.dog === "leashed")
      poi.facilities.push("dog-friendly");
  }

  if (category === "school") {
    poi.schoolType = element.tags?.amenity; // school, college, university
    poi.operator = element.tags?.operator;
    poi.operatorType = element.tags?.["operator:type"]; // public, private, religious
    poi.grades = element.tags?.["school:grades"];
    poi.capacity = element.tags?.capacity;
    poi.language = element.tags?.["language:of:instruction"];
    poi.denomination = element.tags?.denomination || element.tags?.religion;
    poi.established = element.tags?.["start_date"];
    poi.wheelchair = element.tags?.wheelchair;
  }

  if (category === "hospital") {
    poi.healthcareType = element.tags?.healthcare || element.tags?.amenity; // hospital, clinic, doctor
    poi.operator = element.tags?.operator;
    poi.emergency = element.tags?.emergency; // yes/no
    poi.beds = element.tags?.beds;
    poi.speciality = element.tags?.["healthcare:speciality"];
    poi.wheelchair = element.tags?.wheelchair;
    poi.ambulance = element.tags?.["emergency:ambulance"];
  }

  return poi;
};

// Fetch data from Overpass API
const fetchFromOverpass = (query) => {
  return new Promise((resolve, reject) => {
    const postData = query;
    const options = {
      hostname: "overpass-api.de",
      path: "/api/interpreter",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
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
};

// Delay function to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Main execution
const main = async () => {
  const outputDir = path.join(__dirname, "../../public/assets");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log("🌳 Fetching Parks data from OpenStreetMap...");
    const parksQuery = buildParksQuery();
    const parksData = await fetchFromOverpass(parksQuery);
    const parksFormatted = {
      elements: parksData.elements
        .filter((el) => el.lat || el.center?.lat)
        .map((el) => formatPOIData(el, "park")),
    };
    fs.writeFileSync(
      path.join(outputDir, "montreal_parks.json"),
      JSON.stringify(parksFormatted, null, 2)
    );
    console.log(`✅ Parks: ${parksFormatted.elements.length} items saved`);

    await delay(3000); // Wait 3 seconds between requests

    console.log("🎓 Fetching Schools/Colleges/Universities data...");
    const schoolsQuery = buildSchoolsQuery();
    const schoolsData = await fetchFromOverpass(schoolsQuery);
    const schoolsFormatted = {
      elements: schoolsData.elements
        .filter((el) => el.lat || el.center?.lat)
        .map((el) => formatPOIData(el, "school")),
    };
    fs.writeFileSync(
      path.join(outputDir, "montreal_schools.json"),
      JSON.stringify(schoolsFormatted, null, 2)
    );
    console.log(`✅ Schools: ${schoolsFormatted.elements.length} items saved`);

    await delay(3000); // Wait 3 seconds between requests

    console.log("🏥 Fetching Hospitals/Clinics data...");
    const hospitalsQuery = buildHospitalsQuery();
    const hospitalsData = await fetchFromOverpass(hospitalsQuery);
    const hospitalsFormatted = {
      elements: hospitalsData.elements
        .filter((el) => el.lat || el.center?.lat)
        .map((el) => formatPOIData(el, "hospital")),
    };
    fs.writeFileSync(
      path.join(outputDir, "montreal_hospitals.json"),
      JSON.stringify(hospitalsFormatted, null, 2)
    );
    console.log(
      `✅ Hospitals: ${hospitalsFormatted.elements.length} items saved`
    );

    // Generate summary statistics
    console.log("\n📊 Summary Statistics:");
    console.log("=".repeat(50));

    // Parks stats
    const parkTypes = {};
    parksFormatted.elements.forEach((park) => {
      const type = park.parkType || "unknown";
      parkTypes[type] = (parkTypes[type] || 0) + 1;
    });
    console.log("\n🌳 Parks by Type:");
    Object.entries(parkTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

    // Schools stats
    const schoolTypes = {};
    schoolsFormatted.elements.forEach((school) => {
      const type = school.schoolType || "unknown";
      schoolTypes[type] = (schoolTypes[type] || 0) + 1;
    });
    console.log("\n🎓 Schools by Type:");
    Object.entries(schoolTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

    // Hospitals stats
    const healthTypes = {};
    hospitalsFormatted.elements.forEach((hospital) => {
      const type = hospital.healthcareType || "unknown";
      healthTypes[type] = (healthTypes[type] || 0) + 1;
    });
    console.log("\n🏥 Healthcare Facilities by Type:");
    Object.entries(healthTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

    console.log("\n" + "=".repeat(50));
    console.log(
      "✨ Done! Enhanced Parks, Schools, and Hospitals data has been fetched."
    );
    console.log("\nFiles saved to:");
    console.log(`   - ${path.join(outputDir, "montreal_parks.json")}`);
    console.log(`   - ${path.join(outputDir, "montreal_schools.json")}`);
    console.log(`   - ${path.join(outputDir, "montreal_hospitals.json")}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

main();
