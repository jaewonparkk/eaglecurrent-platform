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
};

function cleanHtml(html: string | null) {
    if (!html) return "No description";
  
    const withoutTags = html.replace(/<[^>]+>/g, "");
  
    const textarea = document.createElement("textarea");
    textarea.innerHTML = withoutTags;
  
    return textarea.value.replace(/\s+/g, " ").trim();
  }

export default function FeedPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const savedInterests: string[] = JSON.parse(
    localStorage.getItem("interests") || "[]"
  );

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
        return;
      }

      setEvents(data || []);
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