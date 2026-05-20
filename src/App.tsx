import { Routes, Route } from "react-router-dom";
import FeedPage from "./pages/FeedPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import MapPage from "./pages/MapPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FeedPage />} />
      <Route path="/clubs/:orgId" element={<ClubDetailPage />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  );
}

export default App;