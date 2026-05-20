import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  organization_name: string;
  location: string;
  start_time: string;
  end_time: string;
  description: string;
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

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading events...</div>;
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Events</h1>

      <p>{events.length} events found</p>

      {events.map((event) => (
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
        </div>
      ))}
    </div>
  );
}