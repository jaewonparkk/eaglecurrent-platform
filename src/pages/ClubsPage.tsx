import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Club = {
  id: string;
  name: string;
  short_name: string;
  summary: string;
  profile_picture: string;
  category_names: string[];
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <h1 className="mb-6 text-4xl font-bold">Boston College Clubs</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            {club.profile_picture && (
              <img
                src={`https://se-images.campuslabs.com/clink/images/${club.profile_picture}`}
                alt={club.name}
                className="mb-4 h-40 w-full rounded-xl object-cover"
              />
            )}

            <h2 className="text-xl font-semibold">
              {club.short_name || club.name}
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              {club.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {club.category_names?.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-neutral-200 px-3 py-1 text-xs"
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