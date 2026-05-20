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
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "32px",
      }}
    >
      <h1
        style={{
          fontSize: "40px",
          fontWeight: 800,
          marginBottom: "20px",
        }}
      >
        Boston College Clubs
      </h1>

      <input
        type="text"
        placeholder="Search clubs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "14px 18px",
          borderRadius: "14px",
          border: "1px solid #ddd",
          marginBottom: "24px",
          fontSize: "16px",
        }}
      />

      <p style={{ marginBottom: "24px", color: "#666" }}>
        {filteredClubs.length} clubs found
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {filteredClubs.map((club) => (
          <Link
            key={club.id}
            to={`/clubs/${club.campus_labs_org_id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "18px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              {club.profile_picture && (
                <img
                  src={`https://se-images.campuslabs.com/clink/images/${club.profile_picture}`}
                  alt={club.name}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    marginBottom: "14px",
                  }}
                />
              )}

              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {club.short_name || club.name}
              </h2>

              <p
                style={{
                  color: "#555",
                  lineHeight: 1.5,
                  fontSize: "14px",
                }}
              >
                {club.summary || "No summary available."}
              </p>

              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {club.category_names?.map((category) => (
                  <span
                    key={category}
                    style={{
                      background: "#eee",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                    }}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}