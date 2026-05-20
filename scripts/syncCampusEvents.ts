import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey)

const CAMPUS_LABS_API =
  'https://bc.campuslabs.com/engage/api/discovery/event/search?orderByField=endsOn&orderByDirection=ascending&status=Approved&take=25&query='

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
      latitude: event.latitude,
      longitude: event.longitude,
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