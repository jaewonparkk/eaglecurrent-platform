import { Routes, Route, Link } from "react-router-dom";
import FeedPage from "./pages/FeedPage";
import ClubsPage from "./pages/ClubsPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import MapPage from "./pages/MapPage";
import OnboardingPage from "./pages/OnboardingPage";
import WelcomePage from "./pages/WelcomePage";
import AuthPage from "./pages/AuthPage";
import SplashPage from "./pages/SplashPage";
import ClubDashboardPage from "./pages/ClubDashboardPage";
import CreatePostPage from "./pages/CreatePostPage";
import { useEffect, useState } from "react";
import EditPostPage from "./pages/EditPostPage";

import "./App.css";

function App() {
  const [role, setRole] = useState<string | null>(
    localStorage.getItem("role")
  );

  useEffect(() => {
    function updateRole() {
      setRole(localStorage.getItem("role"));
    }

    window.addEventListener("rolechange", updateRole);

    return () => {
      window.removeEventListener("rolechange", updateRole);
    };
  }, []);

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">
          EagleCurrent
        </Link>

        <div className="nav-links">
          <Link to="/feed" className="nav-link">
            Feed
          </Link>

          <Link to="/clubs" className="nav-link">
            Clubs
          </Link>

          <Link to="/map" className="nav-link">
            Map
          </Link>

          <Link to="/onboarding" className="nav-link">
            Preferences
          </Link>

          {role === "club" && (
            <Link to="/club-dashboard" className="nav-link">
              Club Dashboard
            </Link>
          )}

          <Link to="/auth" className="nav-link">
            Login
          </Link>
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
        

        <Route
          path="/club-dashboard"
          element={<ClubDashboardPage />}
          
        />

<Route
      path="/club-dashboard/posts/:postId/edit"
      element={<EditPostPage />}
    />
        <Route
          path="/club-dashboard/create"
          element={<CreatePostPage />}
        />
      </Routes>

      
    </>
  );
}

export default App;