import { Routes, Route, Link } from "react-router-dom";
import { supabase } from "./lib/supabase";
import FeedPage from "./pages/FeedPage";
import ClubsPage from "./pages/ClubsPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import MapPage from "./pages/MapPage";
import OnboardingPage from "./pages/OnboardingPage";
import WelcomePage from "./pages/WelcomePage";
import AuthPage from "./pages/AuthPage";
import SplashPage from "./pages/SplashPage";
import "./App.css";

function App() {
  return (
    <>
    <nav
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "white",
        }}
      >
        <Link to="/" style={{ fontWeight: 800, color: "#8b0028", textDecoration: "none" }}>
          EagleCurrent
        </Link>

        <div style={{ display: "flex", gap: "18px" }}>
          <Link to="/feed" style={{ textDecoration: "none", color: "#333" }}>Feed</Link>
          <Link to="/clubs" style={{ textDecoration: "none", color: "#333" }}>Clubs</Link>
          <Link to="/map" style={{ textDecoration: "none", color: "#333" }}>Map</Link>
          <Link to="/onboarding" style={{ textDecoration: "none", color: "#333" }}>Preferences</Link>
          <Link to="/auth" style={{ textDecoration: "none", color: "#333" }}>Login</Link>
        </div>
      </nav>

    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/clubs" element={<ClubsPage />} />
      <Route path="/clubs/:orgId" element={<ClubDetailPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
    </>
  );
}

export default App;