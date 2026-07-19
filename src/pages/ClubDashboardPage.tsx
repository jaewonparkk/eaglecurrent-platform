import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import RsvpButton from "../components/RsvpButton";

type ClubPost = {
  id: string;
  club_id: number;
  title: string;
  location: string | null;
  starts_at: string;
  post_type: "generated" | "poster";
  poster_url: string | null;
  published: boolean;
  capacity: number;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClubDashboardPage() {
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function fetchPosts() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Log in with your BC account to manage club posts.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("club_posts")
      .select(`
        id,
        club_id,
        title,
        location,
        starts_at,
        post_type,
        poster_url,
        published,
        capacity
      `)
      .eq("created_by", user.id)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("Error fetching club posts:", error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setPosts((data as ClubPost[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function deletePost(postId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("club_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId)
    );
  }

  return (
    <main className="page">
      <div className="dashboard-header">
        <div>
          <p className="card-eyebrow">Organization tools</p>
          <h1 className="page-title">Club dashboard</h1>
          <p className="page-subtitle">
            Create digital promotion materials and track your published events.
          </p>
        </div>

        <Link to="/club-dashboard/create" className="btn btn-primary">
          + Create post
        </Link>
      </div>

      {message && <p className="page-subtitle">{message}</p>}

      {loading ? (
        <p className="page-subtitle">Loading your posts...</p>
      ) : posts.length === 0 ? (
        <section className="dashboard-empty-card">
          <h2>No digital posts yet</h2>

          <p>
            Create your first event card or publish an existing Canva poster.
          </p>

          <Link to="/club-dashboard/create" className="btn btn-primary">
            Create your first post
          </Link>
        </section>
      ) : (
        <div className="dashboard-post-list">
          {posts.map((post) => (
            <article key={post.id} className="dashboard-post-card">
              <div className="dashboard-post-main">
                {post.poster_url && (
                  <img
                    src={post.poster_url}
                    alt={`${post.title} poster`}
                    className="dashboard-post-image"
                  />
                )}

                <div className="dashboard-post-info">
                  <p className="card-eyebrow">
                    {post.post_type === "poster"
                      ? "Uploaded poster"
                      : "Generated event card"}
                  </p>

                  <h2 className="dashboard-post-title">{post.title}</h2>

                  <p className="card-meta">
                    {post.location || "No location specified"}
                  </p>

                  <p className="card-meta">
                    {formatDateTime(post.starts_at)}
                  </p>
                </div>
              </div>

              <div className="dashboard-rsvp-area">
                <RsvpButton
                  clubPostId={post.id}
                  capacity={post.capacity}
                />
              </div>

              <div className="dashboard-post-actions">
  <Link
    to={`/club-dashboard/posts/${post.id}/edit`}
    className="btn btn-primary"
  >
    Edit
  </Link>

  <Link
    to={`/clubs/${post.club_id}`}
    className="btn btn-outline"
  >
    View club
  </Link>

  <button
    type="button"
    className="btn btn-outline"
    onClick={() => deletePost(post.id)}
  >
    Delete
  </button>
</div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}