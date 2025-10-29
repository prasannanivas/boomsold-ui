import React from "react";

const NeighborhoodFooter = ({ neighborhoodName }) => {
  return (
    <footer
      style={{
        backgroundColor: "#000",
        color: "#fff",
        padding: "40px 20px",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "30px",
        }}
      >
        {/* BoomSold Branding */}
        <div>
          <h3
            style={{
              color: "#FFD700",
              fontSize: "24px",
              fontWeight: 900,
              marginBottom: "12px",
              fontFamily: "'Arial Black', sans-serif",
            }}
          >
            💥 BoomSold
          </h3>
          <p
            style={{
              color: "#aaa",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            Discover Montreal's most walkable neighborhoods with real-time data
            and insights.
          </p>
        </div>

        {/* Neighborhood Info */}
        {neighborhoodName && (
          <div>
            <h4
              style={{
                color: "#4ECDC4",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Current Neighborhood
            </h4>
            <p
              style={{
                color: "#FFD700",
                fontSize: "18px",
                fontWeight: 600,
                margin: "0",
              }}
            >
              {neighborhoodName}
            </p>
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h4
            style={{
              color: "#4ECDC4",
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Explore
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <li style={{ marginBottom: "8px" }}>
              <a
                href="#walkability"
                style={{
                  color: "#aaa",
                  textDecoration: "none",
                  fontSize: "14px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FFD700")}
                onMouseLeave={(e) => (e.target.style.color = "#aaa")}
              >
                🚶 Walkability Scores
              </a>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <a
                href="#transit"
                style={{
                  color: "#aaa",
                  textDecoration: "none",
                  fontSize: "14px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FFD700")}
                onMouseLeave={(e) => (e.target.style.color = "#aaa")}
              >
                🚌 Transit Options
              </a>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <a
                href="#bike"
                style={{
                  color: "#aaa",
                  textDecoration: "none",
                  fontSize: "14px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FFD700")}
                onMouseLeave={(e) => (e.target.style.color = "#aaa")}
              >
                🚴 Bike Friendliness
              </a>
            </li>
          </ul>
        </div>

        {/* Data Attribution */}
        <div>
          <h4
            style={{
              color: "#4ECDC4",
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Data Sources
          </h4>
          <p
            style={{
              color: "#aaa",
              fontSize: "12px",
              lineHeight: "1.6",
              margin: "0 0 8px 0",
            }}
          >
            Powered by{" "}
            <a
              href="https://www.walkscore.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#4ECDC4",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Walk Score®
            </a>
          </p>
          <p
            style={{
              color: "#aaa",
              fontSize: "12px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            Map data © OpenStreetMap contributors
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "30px auto 0",
          paddingTop: "20px",
          borderTop: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <p
          style={{
            color: "#666",
            fontSize: "12px",
            margin: 0,
          }}
        >
          © 2025 BoomSold. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "20px" }}>
          <a
            href="#privacy"
            style={{
              color: "#666",
              textDecoration: "none",
              fontSize: "12px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#FFD700")}
            onMouseLeave={(e) => (e.target.style.color = "#666")}
          >
            Privacy
          </a>
          <a
            href="#terms"
            style={{
              color: "#666",
              textDecoration: "none",
              fontSize: "12px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#FFD700")}
            onMouseLeave={(e) => (e.target.style.color = "#666")}
          >
            Terms
          </a>
          <a
            href="#contact"
            style={{
              color: "#666",
              textDecoration: "none",
              fontSize: "12px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#FFD700")}
            onMouseLeave={(e) => (e.target.style.color = "#666")}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default NeighborhoodFooter;
