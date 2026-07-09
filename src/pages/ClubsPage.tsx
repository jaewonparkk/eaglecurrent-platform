import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Club = {
  id: string;
  campus_labs_org_id: number;
  name: string;
  short_name: string;
  summary: string;
  profile_picture: string;
  category_names: string[];
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchClubs() {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .order("name");

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setClubs(data || []);
      setLoading(false);
    }

    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter((club) => {
    const text = `
      ${club.name}
      ${club.short_name}
      ${club.summary}
      ${club.category_names?.join(" ")}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading clubs...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Boston College Clubs</h1>
        <p className="page-subtitle">
          Search 400+ student organizations from BC Engage.
        </p>
      </div>
  
      <input
        className="search-input"
        type="text"
        placeholder="Search clubs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
  
      <p className="page-subtitle" style={{ marginBottom: "20px" }}>
        {filteredClubs.length} clubs found
      </p>
  
      <div className="card-grid">
        {filteredClubs.map((club) => (
          <Link
            key={club.id}
            to={`/clubs/${club.campus_labs_org_id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div className="card" style={{ height: "100%" }}>
              {club.profile_picture && (
                <img
                  src={`https://se-images.campuslabs.com/clink/images/${club.profile_picture}`}
                  alt={club.name}
                  className="card-image"
                />
              )}
  
              <h2 className="card-title">
                {club.short_name || club.name}
              </h2>
  
              <p className="card-description">
                {club.summary || "No summary available."}
              </p>
  
              <div className="badge-row">
                {club.category_names?.length ? (
                  club.category_names.map((category) => (
                    <span key={category} className="badge">
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="badge">No category</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}