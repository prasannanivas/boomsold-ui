import React from "react";
import { getWalkScoreColor } from "../utils/walkabilityScores";

const WalkabilityScoresBadge = ({ walkabilityScores, enhancedScores }) => {
  return (
    <div
      style={{
        marginTop: "24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        width: "100%",
      }}
    >
      {/* Walk Score Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "3px solid #FFD700",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,215,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "48px",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          🚶
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "1px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Walk Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "900",
            color: getWalkScoreColor(walkabilityScores.walkScore),
            textAlign: "center",
            marginBottom: "16px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {walkabilityScores.walkScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "12px",
            backgroundColor: "#f0f0f0",
            borderRadius: "6px",
            overflow: "hidden",
            border: "2px solid #e0e0e0",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.walkScore}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${getWalkScoreColor(
                walkabilityScores.walkScore
              )}, ${getWalkScoreColor(walkabilityScores.walkScore)}dd)`,
              transition: "width 0.8s ease",
              boxShadow: `0 0 10px ${getWalkScoreColor(
                walkabilityScores.walkScore
              )}80`,
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textAlign: "center",
          }}
        >
          {walkabilityScores.walkScore >= 90
            ? "Walker's Paradise"
            : walkabilityScores.walkScore >= 70
            ? "Very Walkable"
            : walkabilityScores.walkScore >= 50
            ? "Somewhat Walkable"
            : "Car-Dependent"}
        </div>
      </div>

      {/* Transit Score Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "3px solid #4ECDC4",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(78,205,196,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "48px",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          🚇
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "1px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Transit Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "900",
            color: getWalkScoreColor(walkabilityScores.transitScore),
            textAlign: "center",
            marginBottom: "16px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {walkabilityScores.transitScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "12px",
            backgroundColor: "#f0f0f0",
            borderRadius: "6px",
            overflow: "hidden",
            border: "2px solid #e0e0e0",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.transitScore}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${getWalkScoreColor(
                walkabilityScores.transitScore
              )}, ${getWalkScoreColor(walkabilityScores.transitScore)}dd)`,
              transition: "width 0.8s ease",
              boxShadow: `0 0 10px ${getWalkScoreColor(
                walkabilityScores.transitScore
              )}80`,
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textAlign: "center",
            marginBottom: enhancedScores?.transitDetails ? "12px" : "0",
          }}
        >
          {walkabilityScores.transitScore >= 90
            ? "Rider's Paradise"
            : walkabilityScores.transitScore >= 70
            ? "Excellent Transit"
            : walkabilityScores.transitScore >= 50
            ? "Good Transit"
            : "Some Transit"}
        </div>

        {/* Transit Details */}
        {enhancedScores?.transitDetails && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "rgba(78, 205, 196, 0.1)",
              borderRadius: "8px",
              border: "2px solid rgba(78, 205, 196, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#333",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              <span style={{ marginRight: "6px" }}>🚌</span>
              {enhancedScores.transitDetails.summary}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#666",
              }}
            >
              {enhancedScores.transitDetails.description}
            </div>
          </div>
        )}
      </div>

      {/* Bike Score Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "3px solid #FF6B6B",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,107,107,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "48px",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          🚴
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "1px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Bike Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "900",
            color: getWalkScoreColor(walkabilityScores.bikeScore),
            textAlign: "center",
            marginBottom: "16px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {walkabilityScores.bikeScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "12px",
            backgroundColor: "#f0f0f0",
            borderRadius: "6px",
            overflow: "hidden",
            border: "2px solid #e0e0e0",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.bikeScore}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${getWalkScoreColor(
                walkabilityScores.bikeScore
              )}, ${getWalkScoreColor(walkabilityScores.bikeScore)}dd)`,
              transition: "width 0.8s ease",
              boxShadow: `0 0 10px ${getWalkScoreColor(
                walkabilityScores.bikeScore
              )}80`,
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textAlign: "center",
            marginBottom: enhancedScores?.bikeDetails ? "12px" : "0",
          }}
        >
          {walkabilityScores.bikeScore >= 90
            ? "Biker's Paradise"
            : walkabilityScores.bikeScore >= 70
            ? "Very Bikeable"
            : walkabilityScores.bikeScore >= 50
            ? "Bikeable"
            : "Somewhat Bikeable"}
        </div>

        {/* Bike Details */}
        {enhancedScores?.bikeDetails && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "rgba(255, 107, 107, 0.1)",
              borderRadius: "8px",
              border: "2px solid rgba(255, 107, 107, 0.3)",
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

      {/* Overall Accessibility Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "3px solid #9B59B6",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(155,89,182,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "48px",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          ⭐
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "1px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Overall Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "900",
            color: getWalkScoreColor(walkabilityScores.accessibilityScore),
            textAlign: "center",
            marginBottom: "16px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {walkabilityScores.accessibilityScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "12px",
            backgroundColor: "#f0f0f0",
            borderRadius: "6px",
            overflow: "hidden",
            border: "2px solid #e0e0e0",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.accessibilityScore}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${getWalkScoreColor(
                walkabilityScores.accessibilityScore
              )}, ${getWalkScoreColor(
                walkabilityScores.accessibilityScore
              )}dd)`,
              transition: "width 0.8s ease",
              boxShadow: `0 0 10px ${getWalkScoreColor(
                walkabilityScores.accessibilityScore
              )}80`,
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textAlign: "center",
          }}
        >
          {walkabilityScores.accessibilityScore >= 90
            ? "Highly Accessible"
            : walkabilityScores.accessibilityScore >= 70
            ? "Very Accessible"
            : walkabilityScores.accessibilityScore >= 50
            ? "Moderately Accessible"
            : "Less Accessible"}
        </div>
      </div>

      {/* Description Card - Full Width */}
      <div
        style={{
          gridColumn: "1 / -1",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "3px solid #FFD700",
          marginTop: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: "36px" }}>💡</div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#333",
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: "1.6",
              }}
            >
              {walkabilityScores.description}
            </p>

            {/* Data Source Attribution */}
            <div
              style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "2px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
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
                    fontWeight: 700,
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
                    fontSize: "11px",
                    color: "#000",
                    textDecoration: "none",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    backgroundColor: "#FFD700",
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFC700";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFD700";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  View Full Analysis →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkabilityScoresBadge;
