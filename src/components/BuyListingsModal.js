import React, { useState, useEffect } from "react";
import "./BuyListingsModal.css";

const BuyListingsModal = ({ isOpen, onClose, neighborhoodName }) => {
  const [step, setStep] = useState(1); // 1 = email, 2 = refine, 3 = success
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refinement state
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [notes, setNotes] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState(null);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail("");
      setIsSubmitting(false);
      setSelectedFilters([]);
      setNotes("");
      setShowOptional(false);
      setSelectedBudget(null);
      setSelectedBedrooms(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filterOptions = [
    { id: "90plus", label: "Homes that have been on the market 90+ days" },
    { id: "fixer", label: "Fixer-upper opportunities" },
    { id: "turnkey", label: "Turnkey homes" },
    { id: "value", label: "Homes with strong value" },
  ];

  const budgetOptions = [
    { id: "400-600", label: "$400K–$600K" },
    { id: "600-800", label: "$600K–$800K" },
    { id: "800-1m", label: "$800K–$1M" },
    { id: "1m+", label: "$1M+" },
  ];

  const bedroomOptions = [
    { id: "2+", label: "2+" },
    { id: "3+", label: "3+" },
    { id: "4+", label: "4+" },
  ];

  const toggleFilter = (id) => {
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const formData = {
      email,
      neighborhoodName,
      requestType: "buy-listings",
      timestamp: new Date().toISOString(),
    };

    console.log("Buy listings email submitted:", formData);

    // TODO: Send to backend API
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsSubmitting(false);
    setStep(2);
  };

  const handleRefineSubmit = async () => {
    setIsSubmitting(true);

    const formData = {
      email, // Associated email from step 1
      neighborhoodName,
      requestType: "buy-listings-refined",
      filters: selectedFilters,
      notes,
      budget: selectedBudget,
      bedrooms: selectedBedrooms,
      timestamp: new Date().toISOString(),
    };

    console.log("Refined search submitted:", formData);

    // TODO: Send to backend API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setStep(3);
  };

  return (
    <div className="blm-overlay" onClick={onClose}>
      <div className="blm-content" onClick={(e) => e.stopPropagation()}>
        <button className="blm-close" onClick={onClose}>×</button>

        {/* STEP 1: Email Collection */}
        {step === 1 && (
          <div className="blm-step blm-step-email">
            <h2 className="blm-title">Strong opportunities in this neighborhood.</h2>
            {neighborhoodName && (
              <p className="blm-neighborhood">{neighborhoodName}</p>
            )}
            <form onSubmit={handleEmailSubmit} className="blm-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="blm-email-input"
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="blm-cta-button"
                disabled={!email || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "SEND ME THE LISTINGS"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Refinement */}
        {step === 2 && !isSubmitting && (
          <div className="blm-step blm-step-refine">
            <h2 className="blm-title">LET'S REFINE YOUR SEARCH</h2>
            <p className="blm-subtitle">
              We highlight homes based on market trends and opportunity
            </p>

            {/* Multi-select filter checkboxes */}
            <div className="blm-filters">
              {filterOptions.map((option) => (
                <label
                  key={option.id}
                  className={`blm-filter-option ${
                    selectedFilters.includes(option.id) ? "selected" : ""
                  }`}
                  onClick={() => toggleFilter(option.id)}
                >
                  <span className="blm-checkbox">
                    {selectedFilters.includes(option.id) ? "✓" : ""}
                  </span>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {/* Notes */}
            <div className="blm-notes-section">
              <label className="blm-notes-label">ADD NOTES:</label>
              <textarea
                className="blm-notes-input"
                placeholder="e.g. specific street, neighborhood, style, or must-haves"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Optional refinements toggle */}
            {!showOptional && (
              <button
                className="blm-optional-toggle"
                onClick={() => setShowOptional(true)}
              >
                Optional — refine your results
              </button>
            )}

            {showOptional && (
              <div className="blm-optional-section">
                {/* Budget pills */}
                <div className="blm-pill-group">
                  <label className="blm-pill-label">Budget:</label>
                  <div className="blm-pills">
                    {budgetOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className={`blm-pill ${
                          selectedBudget === opt.id ? "active" : ""
                        }`}
                        onClick={() =>
                          setSelectedBudget(
                            selectedBudget === opt.id ? null : opt.id
                          )
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms pills */}
                <div className="blm-pill-group">
                  <label className="blm-pill-label">Bedrooms:</label>
                  <div className="blm-pills">
                    {bedroomOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className={`blm-pill ${
                          selectedBedrooms === opt.id ? "active" : ""
                        }`}
                        onClick={() =>
                          setSelectedBedrooms(
                            selectedBedrooms === opt.id ? null : opt.id
                          )
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              className="blm-cta-button"
              onClick={handleRefineSubmit}
            >
              REFINE
            </button>
          </div>
        )}

        {/* STEP 2 Loading state */}
        {step === 2 && isSubmitting && (
          <div className="blm-step blm-step-loading">
            <div className="blm-spinner"></div>
            <h2 className="blm-title">Your Listings Are Being Prepared.</h2>
            <p className="blm-subtitle">
              You'll receive them shortly by email.
            </p>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="blm-step blm-step-success">
            <div className="blm-success-icon">✓</div>
            <h2 className="blm-title">Your Listings Are Being Prepared.</h2>
            <p className="blm-subtitle">
              You'll receive them shortly by email.
            </p>
            <button className="blm-cta-button blm-done-button" onClick={onClose}>
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyListingsModal;
