import React from "react";
import { getWalkScoreColor } from "../utils/walkabilityScores";

const WalkabilityScoresBadge = ({ walkabilityScores, enhancedScores }) => {
  return (
    <div
      style={{
        marginTop: "16px",
        paddingTop: "12px",
        borderTop: "2px solid #FFD700",
        width: "320px",
        maxWidth: "100%",
      }}
    >
      <h4
        style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          fontWeight: 700,
          color: "#000",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        🚶 Walkability & Accessibility
      </h4>

      {/* Walk Score */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            Walk Score
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: getWalkScoreColor(walkabilityScores.walkScore),
            }}
          >
            {walkabilityScores.walkScore}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.walkScore}%`,
              height: "100%",
              backgroundColor: getWalkScoreColor(walkabilityScores.walkScore),
              transition: "width 0.6s ease",
              boxShadow: "0 0 8px rgba(255, 215, 0, 0.3)",
            }}
          />
        </div>
      </div>

      {/* Transit Score */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            Transit Score
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: getWalkScoreColor(walkabilityScores.transitScore),
            }}
          >
            {walkabilityScores.transitScore}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.transitScore}%`,
              height: "100%",
              backgroundColor: getWalkScoreColor(
                walkabilityScores.transitScore
              ),
              transition: "width 0.6s ease",
              boxShadow: "0 0 8px rgba(78, 205, 196, 0.3)",
            }}
          />
        </div>

        {/* Transit Details */}
        {enhancedScores?.transitDetails && (
          <div
            style={{
              marginTop: "6px",
              padding: "8px 12px",
              backgroundColor: "rgba(78, 205, 196, 0.08)",
              borderRadius: "6px",
              borderLeft: "3px solid #4ECDC4",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#333",
                fontWeight: 600,
                marginBottom: "2px",
              }}
            >
              <span style={{ marginRight: "6px" }}>🚌</span>
              {enhancedScores.transitDetails.summary}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginLeft: "20px",
              }}
            >
              {enhancedScores.transitDetails.description}
            </div>
          </div>
        )}
      </div>

      {/* Bike Score */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            Bike Score
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: getWalkScoreColor(walkabilityScores.bikeScore),
            }}
          >
            {walkabilityScores.bikeScore}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.bikeScore}%`,
              height: "100%",
              backgroundColor: getWalkScoreColor(walkabilityScores.bikeScore),
              transition: "width 0.6s ease",
              boxShadow: "0 0 8px rgba(255, 215, 0, 0.3)",
            }}
          />
        </div>

        {/* Bike Details */}
        {enhancedScores?.bikeDetails && (
          <div
            style={{
              marginTop: "6px",
              padding: "8px 12px",
              backgroundColor: "rgba(255, 215, 0, 0.08)",
              borderRadius: "6px",
              borderLeft: "3px solid #FFD700",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#333",
                fontWeight: 600,
              }}
            >
              <span style={{ marginRight: "6px" }}>🚴</span>
              {enhancedScores.bikeDetails.description}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Score */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            Overall Accessibility
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: getWalkScoreColor(walkabilityScores.accessibilityScore),
            }}
          >
            {walkabilityScores.accessibilityScore}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.accessibilityScore}%`,
              height: "100%",
              backgroundColor: getWalkScoreColor(
                walkabilityScores.accessibilityScore
              ),
              transition: "width 0.6s ease",
              boxShadow: "0 0 8px rgba(78, 205, 196, 0.3)",
            }}
          />
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "rgba(0, 0, 0, 0.04)",
          borderRadius: "6px",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "#555",
            fontStyle: "italic",
            fontWeight: 500,
          }}
        >
          {walkabilityScores.description}
        </p>
      </div>

      {/* Data Source Attribution */}
      <div
        style={{
          borderTop: "1px solid #e0e0e0",
          paddingTop: "10px",
        }}
      >
        <p
          style={{
            margin: "0 0 6px 0",
            fontSize: "10px",
            color: "#888",
            fontWeight: 500,
          }}
        >
          📊 Data powered by{" "}
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
        {enhancedScores?.apiResponse?.ws_link && (
          <a
            href={enhancedScores.apiResponse.ws_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "10px",
              color: "#FFD700",
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              backgroundColor: "rgba(255, 215, 0, 0.1)",
              borderRadius: "4px",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
              e.currentTarget.style.borderColor = "#FFD700";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)";
            }}
          >
            View Full Analysis →
          </a>
        )}
      </div>
    </div>
  );
};

export default WalkabilityScoresBadge;
