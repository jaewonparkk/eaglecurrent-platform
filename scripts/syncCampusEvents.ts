import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey)

const now = encodeURIComponent(
    new Date().toISOString()
  );
  
const CAMPUS_LABS_API =
    `https://bc.campuslabs.com/engage/api/discovery/event/search?endsAfter=${now}&orderByField=endsOn&orderByDirection=ascending&status=Approved&take=100&query=`;

const LOCATION_COORDS: Record<string, [number, number]> = {
        // O'Neill Library / O'Neill Plaza area
        "O'Neill Plaza": [42.33535, -71.16945],
        "O'Neill Library": [42.33535, -71.16945],
      
        // McElroy Commons area
        // Heights Room / Cabaret Room are BC event/dining spaces associated with McElroy/New Dining Hall area.
        "McElroy Commons": [42.33715, -71.17100],
        "Heights Room": [42.33715, -71.17100],
        "Cabaret Room": [42.33715, -71.17100],
      
        // Corcoran Commons / Lower Dining Hall area
        "Corcoran Commons": [42.33420, -71.16695],
        "Lower Dining Hall": [42.33420, -71.16695],
        "Upstairs at Lower Dining Hall": [42.33420, -71.16695],
      
        // O'Connell House
        "O'Connell House": [42.34135, -71.16595],
      
        // Linden Lane / Gasson Quad area
        "Linden Lane": [42.33565, -71.16865],
        "Gasson Hall": [42.33575, -71.16855],
        "Gasson Quad": [42.33545, -71.16880],
      
        // Stokes area
        "Stokes Hall": [42.33445, -71.17085],
      
        // Between Vandy and Lower = near Vanderslice / Corcoran Commons walkway
        "Between Vandy and Lower": [42.33500, -71.16725],
      };
async function syncEvents() {
  try {
    const response = await fetch(CAMPUS_LABS_API)

    const data = await response.json()

    const events = data.value

    console.log(`Fetched ${events.length} events`)

    const formattedEvents = events.map((event: any) => ({
      campus_labs_id: event.id,
      institution_id: event.institutionId,
      organization_id: event.organizationId,
      branch_id: event.branchId,
      organization_name: event.organizationName,
      organization_profile_picture:
        event.organizationProfilePicture,
      title: event.name,
      description: event.description,
      location: event.location,
      start_time: event.startsOn,
      end_time: event.endsOn,
      image_path: event.imagePath,
      theme: event.theme,
      visibility: event.visibility,
      approval_status: event.status,
      latitude:LOCATION_COORDS[event.location]?.[0] ?? null,
      longitude:LOCATION_COORDS[event.location]?.[1] ?? null,
      rec_score: event.recScore,
      rsvp_total: event.rsvpTotal,
      search_score: event['@search.score'],
    }))

    const { error } = await supabase
      .from('events')
      .upsert(formattedEvents, {
        onConflict: 'campus_labs_id',
      })

    if (error) {
      console.error('Supabase insert error:', error)
    } else {
      console.log('Events synced successfully!')
    }
  } catch (err) {
    console.error(err)
  }
}

syncEvents()