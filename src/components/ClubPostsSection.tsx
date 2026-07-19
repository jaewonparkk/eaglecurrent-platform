import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import RsvpButton from "./RsvpButton";

type ClubPost = {
  id: string;
  club_id: number;
  post_type: "generated" | "poster";
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  poster_url: string | null;
  registration_url: string | null;
  is_featured: boolean;
  published_at: string;
  capacity: number;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPublishedTime(value: string | null) {
  if (!value) {
    return "";
  }

  const difference =
    Date.now() - new Date(value).getTime();

  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${days}d ago`;
}

export default function ClubPostsSection() {
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [visiblePosterIds, setVisiblePosterIds] = useState<string[]>([]);

  function toggleDescription(postId: string) {
    setExpandedPostIds((currentIds) =>
      currentIds.includes(postId)
        ? currentIds.filter((id) => id !== postId)
        : [...currentIds, postId]
    );
  }

  function togglePoster(postId: string) {
    setVisiblePosterIds((currentIds) =>
      currentIds.includes(postId)
        ? currentIds.filter((id) => id !== postId)
        : [...currentIds, postId]
    );
  }

  useEffect(() => {
    async function fetchClubPosts() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("club_posts")
        .select(`
          id,
          club_id,
          post_type,
          title,
          description,
          location,
          starts_at,
          ends_at,
          poster_url,
          registration_url,
          is_featured,
          published_at,
          capacity
        `)
        .eq("published", true)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Error fetching club posts:", error);
        setErrorMessage("Unable to load digital club posts.");
        setLoading(false);
        return;
      }

      setPosts((data as ClubPost[]) || []);
      setLoading(false);
    }

    fetchClubPosts();
  }, []);

  if (loading) {
    return (
      <section className="club-posts-section">
        <p className="page-subtitle">
          Loading digital club posts...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="club-posts-section">
        <p className="page-subtitle">{errorMessage}</p>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="club-posts-section">
      <div className="club-posts-heading">
        <div>
          <p className="card-eyebrow">
            Posted by BC organizations
          </p>

          <h2 className="club-posts-title">
            Featured Club Posts
          </h2>

          <p className="page-subtitle">
            Digital posters and events published directly by student
            organizations.
          </p>
        </div>
      </div>

      <div className="club-posts-grid">
        {posts.map((post) => {
          const startsAt = formatDateTime(post.starts_at);
          const endsAt = formatDateTime(post.ends_at);

          const descriptionOpen =
            expandedPostIds.includes(post.id);

          const posterOpen =
            visiblePosterIds.includes(post.id);

          return (
            <article
              key={post.id}
              className={`club-post-card ${
                post.is_featured
                  ? "club-post-card-featured"
                  : ""
              }`}
            >
              <div className="club-post-card-top">
                <div>
                  <p className="card-eyebrow">
                    {post.post_type === "poster"
                      ? "Digital poster"
                      : "Generated event card"}
                  </p>

                  <p className="club-post-published">
                    {formatPublishedTime(post.published_at)}
                  </p>
                </div>

                {post.is_featured && (
                  <span className="featured-badge">
                    Featured
                  </span>
                )}
              </div>

              <div className="club-post-content">
                <h3 className="club-post-title">
                  {post.title}
                </h3>

                <p className="card-meta">
                  {post.location || "Location to be announced"}
                </p>

                <p className="card-meta">
                  {startsAt || "Start time unavailable"}
                  {endsAt ? ` – ${endsAt}` : ""}
                </p>

                <div className="club-post-detail-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => toggleDescription(post.id)}
                  >
                    {descriptionOpen
                      ? "Hide Details"
                      : "About Event"}
                  </button>

                  {post.poster_url && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => togglePoster(post.id)}
                    >
                      {posterOpen
                        ? "Hide Poster"
                        : "View Poster"}
                    </button>
                  )}
                </div>

                {descriptionOpen && (
                  <div className="club-post-details-panel">
                    <h4>About this event</h4>

                    <p>
                      {post.description?.trim() ||
                        "No additional description was provided."}
                    </p>
                  </div>
                )}

                {posterOpen && post.poster_url && (
                  <div className="club-post-poster-panel">
                    <img
                      src={post.poster_url}
                      alt={`${post.title} poster`}
                      className="club-post-expanded-poster"
                    />
                  </div>
                )}

                <div className="club-post-actions">
                  <Link
                    to={`/clubs/${post.club_id}`}
                    className="btn btn-outline"
                  >
                    View Club
                  </Link>

                  {post.registration_url && (
                    <a
                      href={post.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                    >
                      Registration
                    </a>
                  )}

                  <RsvpButton
                    clubPostId={post.id}
                    capacity={post.capacity}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}