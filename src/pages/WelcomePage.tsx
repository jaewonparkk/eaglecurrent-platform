import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  function chooseRole(role: "student" | "club") {
    localStorage.setItem("role", role);
  
    if (role === "club") {
      navigate("/club-dashboard");
    } else {
      navigate("/onboarding");
    }
  }

  return (
    <div style={{ padding: "32px" }}>
      <h1>Welcome to EagleCurrent</h1>
      <p>Choose how you want to use EagleCurrent.</p>

      <button onClick={() => chooseRole("student")}>
        I am a student
      </button>

      <br />
      <br />

      <button onClick={() => chooseRole("club")}>
        I represent a club or organization
      </button>
    </div>
  );
}