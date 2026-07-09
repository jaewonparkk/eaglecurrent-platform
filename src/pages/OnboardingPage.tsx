import { useState } from "react";
import { useNavigate } from "react-router-dom";

const INTERESTS = [
  "Computer Science",
  "Finance",
  "Business",
  "Environment",
  "Neuroscience",
  "Arts",
  "Music",
  "Campus Ministry",
  "Service",
  "Leadership",
  "Intercultural",
  "Health",
];


export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  function toggleInterest(interest: string) {
    if (selected.includes(interest)) {
      setSelected(selected.filter((item) => item !== interest));
    } else {
      setSelected([...selected, interest]);
    }
  }

  function saveInterests() {
    localStorage.setItem("interests", JSON.stringify(selected));
    localStorage.setItem("hasCompletedOnboarding", "true");
    navigate("/");
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Choose your interests</h1>
        <p className="page-subtitle">
          Pick the topics you want EagleCurrent to use for your feed.
        </p>
      </div>
  
      <div className="chip-grid">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
  
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`chip ${isSelected ? "chip-selected" : ""}`}
            >
              {interest}
            </button>
          );
        })}
      </div>
  
      <button
        onClick={saveInterests}
        className="btn btn-primary"
        disabled={selected.length === 0}
      >
        Save interests
      </button>
    </div>
  );
}