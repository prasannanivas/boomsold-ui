import React, { useState, useEffect } from "react";
import "./AnimatedIntro.css";

const AnimatedIntro = ({ onAnimationComplete }) => {
  const [animationStage, setAnimationStage] = useState("initial");

  useEffect(() => {
    // Start the animation sequence
    const timer1 = setTimeout(() => {
      setAnimationStage("centered");
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationStage("moving-up");
    }, 2500);

    const timer3 = setTimeout(() => {
      setAnimationStage("final-position");
    }, 3500);

    const timer4 = setTimeout(() => {
      onAnimationComplete();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className={`animated-intro ${animationStage}`}>
      <div className="logo-container">
        <img
          src={
            process.env.PUBLIC_URL +
            "/assets/BOOM SOLD LOGO 2025 YELLOW PNG LARGE.png"
          }
          alt="BoomSold"
          className="boomsold-logo"
        />
      </div>

      {/* Background animation elements */}
      <div className="background-animation">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>
    </div>
  );
};

export default AnimatedIntro;
