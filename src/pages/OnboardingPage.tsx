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
    navigate("/");
  }

  return (
    <div>
      <h1>Choose your interests</h1>

      {INTERESTS.map((interest) => (
        <div key={interest}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(interest)}
              onChange={() => toggleInterest(interest)}
            />
            {interest}
          </label>
        </div>
      ))}

      <button onClick={saveInterests}>
        Save interests
      </button>
    </div>
  );
}