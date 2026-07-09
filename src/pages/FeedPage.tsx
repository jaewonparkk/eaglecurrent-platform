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

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FeedPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedEventIds, setExpandedEventIds] = useState<string[]>([]);
  function toggleEventDetails(eventId: string) {
    if (expandedEventIds.includes(eventId)) {
      setExpandedEventIds(expandedEventIds.filter((id) => id !== eventId));
    } else {
      setExpandedEventIds([...expandedEventIds, eventId]);
    }
  }
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
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
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
    return (
      <div className="page">
        <p className="page-subtitle">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Events</h1>
        <p className="page-subtitle">
          Your interests:{" "}
          {savedInterests.length > 0
            ? savedInterests.join(", ")
            : "None selected"}
        </p>
      </div>

      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <p className="page-subtitle">{filteredEvents.length} events found</p>

      <div className="card-list">
        {filteredEvents.map((event) => {
          const start = formatDateTime(event.start_time);
          const end = formatDateTime(event.end_time);

          return (
            <div key={event.id} className="card">
              {event.match_score ? (
                <p className="card-eyebrow">
                  Match score: {event.match_score}
                </p>
              ) : null}

              <h2 className="card-title">{event.title}</h2>

              <p className="card-meta">{event.organization_name}</p>
              <p className="card-meta">
                {event.location || "No location specified"}
              </p>
              <p className="card-meta">
                {start ? start : "No start time"}
                {end ? ` – ${end}` : ""}
              </p>

              {event.category_names?.length ? (
  <div className="badge-row">
    {event.category_names.map((category) => (
      <span key={category} className="badge">
        {category}
      </span>
    ))}
  </div>
) : null}

<div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
  <button
    type="button"
    className="btn btn-outline"
    onClick={() => toggleEventDetails(event.id)}
  >
    {expandedEventIds.includes(event.id) ? "Hide Details" : "About Event"}
  </button>

  <Link
    to={`/clubs/${event.organization_id}`}
    className="btn btn-primary"
  >
    View Club →
  </Link>
</div>

{expandedEventIds.includes(event.id) && (
  <p className="card-description">
    {cleanHtml(event.description)}
  </p>
)}
            </div>
          );
        })}
      </div>
    </div>
  );
}