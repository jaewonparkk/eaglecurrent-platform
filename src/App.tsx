import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

type Club = {
  id: string;
  name: string;
  short_name: string;
  summary: string;
  profile_picture: string;
  category_names: string[];
};

function App() {
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
        return;
      }

      setClubs(data || []);
      setLoading(false);
    }

    fetchClubs();
  }, []);

  if (loading) {
    return <div className="p-8">Loading clubs...</div>;
  }

  const filteredClubs = clubs.filter((club) => {
    const text = `
      ${club.name}
      ${club.short_name}
      ${club.summary}
      ${club.category_names?.join(" ")}
    `.toLowerCase();
  
    return text.includes(search.toLowerCase());
  });
  
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <h1 className="mb-6 text-4xl font-bold">
        Boston College Clubs
      </h1>

      <input
          type="text"
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style= {{
            width: "100%",
            maxWidth: "500px",
            padding: "14px 18px",
            borderRadius: "14px",
            border: "1px solid #ddd",
            marginBottom: "28px",
            fontSize: "16px",
          }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {filteredClubs.map((club) => (
          <div
            key={club.id}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            {club.profile_picture && (
              <img
                src={`https://se-images.campuslabs.com/clink/images/${club.profile_picture}`}
                alt={club.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "14px",
                  marginBottom: "16px",
                }}
              />
            )}

            <h2 style={{ fontSize: "22px", fontWeight: 700 }}>
              {club.short_name || club.name}
            </h2>

            <p
              style={{
                marginTop: "10px",
                color: "#555",
                lineHeight: 1.5,
              }}
            >
              {club.summary}
            </p>

            <div
              style={{
                marginTop: "16px",
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
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                  }}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;