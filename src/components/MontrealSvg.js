import React from "react";

function MontrealSvg() {
  return (
    <div className="montreal-flag-banner">
      <svg
        className="montreal-flag"
        viewBox="0 0 900 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Red background */}
        <rect width="900" height="600" fill="#ED1B2E" />
        {/* White cross */}
        <rect x="0" y="250" width="900" height="100" fill="#FFFFFF" />
        <rect x="400" y="0" width="100" height="600" fill="#FFFFFF" />
        {/* Four fleur-de-lis symbols */}
        {/* Top-left */}
        <g transform="translate(200, 125) scale(0.5)">
          <path
            d="M 100 0 L 120 40 L 140 0 L 140 60 L 160 40 L 160 80 L 100 100 L 40 80 L 40 40 L 60 60 L 60 0 L 80 40 Z"
            fill="#ED1B2E"
          />
        </g>
        {/* Top-right */}
        <g transform="translate(600, 125) scale(0.5)">
          <path
            d="M 100 0 L 120 40 L 140 0 L 140 60 L 160 40 L 160 80 L 100 100 L 40 80 L 40 40 L 60 60 L 60 0 L 80 40 Z"
            fill="#ED1B2E"
          />
        </g>
        {/* Bottom-left */}
        <g transform="translate(200, 425) scale(0.5)">
          <path
            d="M 100 0 L 120 40 L 140 0 L 140 60 L 160 40 L 160 80 L 100 100 L 40 80 L 40 40 L 60 60 L 60 0 L 80 40 Z"
            fill="#ED1B2E"
          />
        </g>
        {/* Bottom-right */}
        <g transform="translate(600, 425) scale(0.5)">
          <path
            d="M 100 0 L 120 40 L 140 0 L 140 60 L 160 40 L 160 80 L 100 100 L 40 80 L 40 40 L 60 60 L 60 0 L 80 40 Z"
            fill="#ED1B2E"
          />
        </g>
        {/* Center flower */}
        <g transform="translate(450, 300) scale(1.2)">
          <circle cx="0" cy="0" r="30" fill="#FFFFFF" />
          <path
            d="M 0 -25 L 5 -10 L 10 -25 L 10 0 L 25 -10 L 15 5 L 25 10 L 10 10 L 10 25 L 5 10 L 0 25 L -5 10 L -10 25 L -10 10 L -25 10 L -15 5 L -25 -10 L -10 0 L -10 -25 L -5 -10 Z"
            fill="#ED1B2E"
          />
        </g>
      </svg>
      <span className="montreal-label">MONTREAL</span>
    </div>
  );
}

export default MontrealSvg;
