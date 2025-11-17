import React from "react";

const WalkabilityScoresBadge = ({ walkabilityScores, enhancedScores }) => {
  return (
    <div
      style={{
        marginTop: "12px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        width: "100%",
      }}
    >
      {/* Walk Score Card */}
      <div
        style={{
          backgroundColor: "#ffffffff",
          borderRadius: "12px",
          padding: "16px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          border: "3px solid #FFD700",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,215,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "32px",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          🚶
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#453c0dff",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Walk Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: "900",
            color: "#000000ff",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          {walkabilityScores.walkScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#333333",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #FFD700",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.walkScore}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FFC700)",
              transition: "width 0.8s ease",
              boxShadow: "0 0 8px rgba(255,215,0,0.6)",
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#000000ff",
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
          backgroundColor: "#ffffffff",
          borderRadius: "12px",
          padding: "16px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          border: "3px solid #FFD700",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,215,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "32px",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          🚇
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#2f2907ff",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Transit Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: "900",
            color: "#000000ff",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          {walkabilityScores.transitScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#333333",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #FFD700",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.transitScore}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FFC700)",
              transition: "width 0.8s ease",
              boxShadow: "0 0 8px rgba(255,215,0,0.6)",
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#000000ff",
            textAlign: "center",
            marginBottom: enhancedScores?.transitDetails ? "8px" : "0",
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
              marginTop: "8px",
              padding: "8px",
              backgroundColor: "#FFD700",
              borderRadius: "6px",
              border: "1px solid #FFC700",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "#000000",
                fontWeight: 600,
                marginBottom: "3px",
              }}
            >
              <span style={{ marginRight: "4px" }}>🚌</span>
              {enhancedScores.transitDetails.summary}
            </div>
            <div
              style={{
                fontSize: "8px",
                color: "#000000",
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
          backgroundColor: "#ffffffff",
          borderRadius: "12px",
          padding: "16px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          border: "3px solid #FFD700",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,215,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "32px",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          🚴
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#1e1a04ff",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Bike Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: "900",
            color: "#000000ff",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          {walkabilityScores.bikeScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#333333",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #FFD700",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.bikeScore}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FFC700)",
              transition: "width 0.8s ease",
              boxShadow: "0 0 8px rgba(255,215,0,0.6)",
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: enhancedScores?.bikeDetails ? "8px" : "0",
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
              marginTop: "8px",
              padding: "8px",
              backgroundColor: "#FFD700",
              borderRadius: "6px",
              border: "1px solid #FFC700",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "#000000",
                fontWeight: 600,
              }}
            >
              <span style={{ marginRight: "4px" }}>🚴</span>
              {enhancedScores.bikeDetails.description}
            </div>
          </div>
        )}
      </div>

      {/* Overall Accessibility Card */}
      <div
        style={{
          backgroundColor: "#ffffffff",
          borderRadius: "12px",
          padding: "16px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          border: "3px solid #FFD700",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,215,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "32px",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          ⭐
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#272205ff",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Overall Score
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: "900",
            color: "#000000ff",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          {walkabilityScores.accessibilityScore}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#333333",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #FFD700",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: `${walkabilityScores.accessibilityScore}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FFC700)",
              transition: "width 0.8s ease",
              boxShadow: "0 0 8px rgba(255,215,0,0.6)",
            }}
          />
        </div>

        {/* Score Label */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#000000ff",
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
      {/* <div
        style={{
          gridColumn: "1 / -1",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          border: "2px solid #FFD700",
          marginTop: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "24px" }}>💡</div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#333",
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: "1.5",
              }}
            >
              {walkabilityScores.description}
            </p>

            {/* Data Source Attribution */}
      {/* <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "9px",
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
                    fontSize: "9px",
                    color: "#000",
                    textDecoration: "none",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 12px",
                    backgroundColor: "#FFD700",
                    borderRadius: "6px",
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
      </div> */}
    </div>
  );
};

export default WalkabilityScoresBadge;
