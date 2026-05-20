import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { supabase } from "../lib/supabase";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Event = {
  id: string;
  title: string;
  location: string;
  start_time: string;
  latitude: number;
  longitude: number;
};

export default function MapPage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) {
        console.error(error);
        return;
      }

      setEvents(data || []);
    }

    fetchEvents();
  }, []);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {};

    for (const event of events) {
      const key = `${event.latitude}-${event.longitude}`;

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(event);
    }

    return Object.entries(groups).map(([key, events]) => {
      const first = events[0];

      return {
        key,
        latitude: first.latitude,
        longitude: first.longitude,
        location: first.location,
        events,
      };
    });
  }, [events]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[42.3355, -71.1685]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {groupedEvents.map((group) => (
          <Marker
            key={group.key}
            position={[group.latitude, group.longitude]}
          >
            <Popup>
              <div style={{ minWidth: 220 }}>
                <h3>{group.location}</h3>

                <p>
                  {group.events.length} event
                  {group.events.length > 1 ? "s" : ""}
                </p>

                <div style={{ marginTop: 12 }}>
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <strong>{event.title}</strong>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                        }}
                      >
                        {new Date(
                          event.start_time
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}