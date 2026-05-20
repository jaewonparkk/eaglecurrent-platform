import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL =
  "https://bc.campuslabs.com/engage/api/discovery/search/organizations";

async function syncClubs() {
  let allClubs: any[] = [];

  for (let skip = 0; skip < 500; skip += 100) {
    const params = new URLSearchParams({
      "orderBy[0]": "UpperName asc",
      top: "100",
      filter: "",
      query: "",
      skip: String(skip),
    });

    const url = `${BASE_URL}?${params.toString()}`;

    console.log(`Fetching ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status}`);
      console.error(await response.text());
      return;
    }

    const data = await response.json();

    if (!data.value || data.value.length === 0) {
      console.log("No more clubs found.");
      break;
    }

    allClubs.push(...data.value);
  }

  const clubs = allClubs.map((club) => ({
    campus_labs_org_id: Number(club.Id),
    name: club.Name,
    short_name: club.ShortName,
    website_key: club.WebsiteKey,
    profile_picture: club.ProfilePicture,
    summary: club.Summary,
    description: club.Description,
    category_names: club.CategoryNames ?? [],
    status: club.Status,
    visibility: club.Visibility,
    branch_id: club.BranchId,
  }));

  const { error } = await supabase
    .from("clubs")
    .upsert(clubs, { onConflict: "campus_labs_org_id" });

  if (error) {
    console.error("Supabase upsert error:", error);
    return;
  }

  console.log(`Synced ${clubs.length} clubs`);
}

syncClubs();