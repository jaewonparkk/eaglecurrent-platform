import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

type Event = {
  id: string;
  title: string;
  organization_name: string;
  organization_id: number;
  location: string;
  start_time: string;
  end_time: string;
  description: string;
  category_names?: string[];
  match_score?: number;
};

function cleanHtml(html: string | null) {
    if (!html) return "No description";
  
    const withoutTags = html.replace(/<[^>]+>/g, "");
  
    const textarea = document.createElement("textarea");
    textarea.innerHTML = withoutTags;
  
    return textarea.value.replace(/\s+/g, " ").trim();
  }
  const INTEREST_TO_CATEGORIES: Record<string, string[]> = {
    "Computer Science": ["Academic/Pre-Professional"],
    Finance: ["Academic/Pre-Professional"],
    Business: [
      "Academic/Pre-Professional",
      "Leadership Programs and Organizations",
    ],
    Environment: ["Service", "Volunteer"],
    Neuroscience: ["Academic/Pre-Professional"],
    Arts: ["Performance", "Music"],
    Music: ["Music", "Performance"],
    "Campus Ministry": ["Campus Ministry"],
    Service: ["Service", "Volunteer"],
    Leadership: ["Leadership Programs and Organizations"],
    Intercultural: ["Intercultural"],
    Health: ["Health and Wellness", "Academic/Pre-Professional"],
  };

export default function FeedPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const savedInterests: string[] = JSON.parse(
    localStorage.getItem("interests") || "[]"
  );

  useEffect(() => {
    async function fetchEvents() {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });
    
      if (eventError) {
        console.error("Error fetching events:", eventError);
        setLoading(false);
        return;
      }
    
      const { data: clubData, error: clubError } = await supabase
        .from("clubs")
        .select("campus_labs_org_id, category_names");
    
      if (clubError) {
        console.error("Error fetching clubs:", clubError);
        setEvents(eventData || []);
        setLoading(false);
        return;
      }
    
      const clubCategoryMap = new Map(
        (clubData || []).map((club) => [
          club.campus_labs_org_id,
          club.category_names || [],
        ])
      );
    
      const savedInterests: string[] = JSON.parse(
        localStorage.getItem("interests") || "[]"
      );
    
      const eventsWithScores = (eventData || []).map((event) => {
        const eventCategories =
          clubCategoryMap.get(event.organization_id) || [];
    
        const targetCategories = savedInterests.flatMap(
          (interest) => INTEREST_TO_CATEGORIES[interest] || []
        );
    
        const matchScore = eventCategories.filter((category) =>
          targetCategories.includes(category)
        ).length;
    
        return {
          ...event,
          category_names: eventCategories,
          match_score: matchScore,
        };
      });
    
      eventsWithScores.sort((a, b) => {
        if (b.match_score !== a.match_score) {
          return b.match_score - a.match_score;
        }
    
        return (
          new Date(a.start_time).getTime() -
          new Date(b.start_time).getTime()
        );
      });
    
      setEvents(eventsWithScores);
      setLoading(false);
    }

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const text = `
      ${event.title}
      ${event.organization_name}
      ${event.location}
      ${event.description}
    `.toLowerCase();
  
    return text.includes(search.toLowerCase());
  });

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading events...</div>;
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Events</h1>
      <p>
        Your interests:{" "}
        {savedInterests.length > 0 ? savedInterests.join(", ") : "None selected"}
      </p>
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
            width: "100%",
            maxWidth: "500px",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginBottom: "16px",
            fontSize: "16px",
        }}
        />
      <p>{filteredEvents.length} events found</p>

      {filteredEvents.map((event) => (
        <div
          key={event.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <h2>{event.title}</h2>

          <p>
            <strong>Organization:</strong> {event.organization_name}
          </p>

          <p>
            <strong>Location:</strong> {event.location || "No location specified"}
          </p>

          <p>
            <strong>Start:</strong>{" "}
            {event.start_time
              ? new Date(event.start_time).toLocaleString()
              : "No start time"}
          </p>

          <p>
            <strong>End:</strong>{" "}
            {event.end_time
              ? new Date(event.end_time).toLocaleString()
              : "No end time"}
          </p>

          <p>
            <strong>Description:</strong>{" "}
            {cleanHtml(event.description)}
          </p>

          <p>
  <strong>Categories:</strong>{" "}
  {event.category_names?.length
    ? event.category_names.join(", ")
    : "None"}
</p>

<p>
  <strong>Match score:</strong> {event.match_score || 0}
</p>

          <Link
        to={`/clubs/${event.organization_id}`}
        style={{
            display: "inline-block",
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#8b0028",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
        }}
        >
        View Club →
        </Link>
        </div>
      ))}
    </div>
  );
}