import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ClubDetailPage() {
  const { orgId } = useParams();

  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchClubData() {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("campus_labs_org_id", orgId)
        .single();

      setClub(clubData);

      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", orgId)
        .order("start_time");

      setEvents(eventData || []);
    }

    fetchClubData();
  }, [orgId]);

  if (!club) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <img
        src={`https://se-images.campuslabs.com/clink/images/${club.profile_picture}`}
        alt={club.name}
        style={{
          width: "100%",
          maxHeight: 300,
          objectFit: "cover",
          borderRadius: 20,
          marginBottom: 24,
        }}
      />

      <h1>{club.name}</h1>

      <p style={{ marginTop: 20 }}>
        {club.description}
      </p>

      <div style={{ marginTop: 20 }}>
        {club.category_names?.map((category: string) => (
          <span
            key={category}
            style={{
              background: "#eee",
              padding: "6px 12px",
              borderRadius: 999,
              marginRight: 8,
            }}
          >
            {category}
          </span>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>
        Upcoming Events
      </h2>

      <div style={{ marginTop: 20 }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            <h3>{event.title}</h3>

            <p>{event.location}</p>

            <p>
              {new Date(event.start_time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}