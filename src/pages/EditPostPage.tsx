import {
    useEffect,
    useState,
    type ChangeEvent,
    type FormEvent,
  } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import { supabase } from "../lib/supabase";
  
  type PostType = "generated" | "poster";
  
  type ClubPost = {
    id: string;
    club_id: number;
    created_by: string;
    post_type: PostType;
    title: string;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    poster_url: string | null;
    registration_url: string | null;
    published: boolean;
    is_featured: boolean;
    capacity: number;
  };
  
  function toDateTimeLocal(value: string | null) {
    if (!value) {
      return "";
    }
  
    const date = new Date(value);
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    const localDate = new Date(date.getTime() - timezoneOffset);
  
    return localDate.toISOString().slice(0, 16);
  }
  
  function getStoragePathFromPublicUrl(publicUrl: string) {
    const marker = "/storage/v1/object/public/club-posters/";
    const markerIndex = publicUrl.indexOf(marker);
  
    if (markerIndex === -1) {
      return null;
    }
  
    return decodeURIComponent(
      publicUrl.slice(markerIndex + marker.length)
    );
  }
  
  export default function EditPostPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
  
    const [postType, setPostType] =
      useState<PostType>("generated");
  
    const [clubId, setClubId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [registrationUrl, setRegistrationUrl] =
      useState("");
    const [capacity, setCapacity] = useState("5000");
  
    const [published, setPublished] = useState(true);
    const [isFeatured, setIsFeatured] = useState(true);
  
    const [existingPosterUrl, setExistingPosterUrl] =
      useState("");
  
    const [newPosterFile, setNewPosterFile] =
      useState<File | null>(null);
  
    const [newPosterPreview, setNewPosterPreview] =
      useState("");
  
    const [removeExistingPoster, setRemoveExistingPoster] =
      useState(false);
  
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
  
    useEffect(() => {
      async function fetchPost() {
        if (!postId) {
          setMessage("Post ID is missing.");
          setLoading(false);
          return;
        }
  
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
  
        if (userError || !user) {
          setMessage(
            "You must be logged in to edit this post."
          );
          setLoading(false);
          return;
        }
  
        const { data, error } = await supabase
          .from("club_posts")
          .select(`
            id,
            club_id,
            created_by,
            post_type,
            title,
            description,
            location,
            starts_at,
            ends_at,
            poster_url,
            registration_url,
            published,
            is_featured,
            capacity
          `)
          .eq("id", postId)
          .eq("created_by", user.id)
          .maybeSingle();
  
        if (error) {
          console.error("Error loading club post:", error);
          setMessage(error.message);
          setLoading(false);
          return;
        }
  
        if (!data) {
          setMessage(
            "Post not found or you do not have permission to edit it."
          );
          setLoading(false);
          return;
        }
  
        const post = data as ClubPost;
  
        setPostType(post.post_type);
        setClubId(String(post.club_id));
        setTitle(post.title);
        setDescription(post.description || "");
        setLocation(post.location || "");
        setStartsAt(toDateTimeLocal(post.starts_at));
        setEndsAt(toDateTimeLocal(post.ends_at));
        setRegistrationUrl(post.registration_url || "");
        setCapacity(String(post.capacity || 5000));
        setPublished(post.published);
        setIsFeatured(post.is_featured);
        setExistingPosterUrl(post.poster_url || "");
  
        setLoading(false);
      }
  
      fetchPost();
    }, [postId]);
  
    useEffect(() => {
      return () => {
        if (newPosterPreview) {
          URL.revokeObjectURL(newPosterPreview);
        }
      };
    }, [newPosterPreview]);
  
    function handlePostTypeChange(nextType: PostType) {
      setPostType(nextType);
      setMessage("");
  
      if (nextType === "generated") {
        setRemoveExistingPoster(true);
        setNewPosterFile(null);
  
        if (newPosterPreview) {
          URL.revokeObjectURL(newPosterPreview);
        }
  
        setNewPosterPreview("");
      } else {
        setRemoveExistingPoster(false);
      }
    }
  
    function handlePosterFileChange(
      event: ChangeEvent<HTMLInputElement>
    ) {
      const file = event.target.files?.[0];
  
      if (!file) {
        setNewPosterFile(null);
  
        if (newPosterPreview) {
          URL.revokeObjectURL(newPosterPreview);
        }
  
        setNewPosterPreview("");
        return;
      }
  
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
      ];
  
      if (!allowedTypes.includes(file.type)) {
        setMessage(
          "Please upload a PNG, JPG, or WebP image."
        );
        event.target.value = "";
        return;
      }
  
      const maximumSize = 5 * 1024 * 1024;
  
      if (file.size > maximumSize) {
        setMessage(
          "Poster images must be smaller than 5 MB."
        );
        event.target.value = "";
        return;
      }
  
      if (newPosterPreview) {
        URL.revokeObjectURL(newPosterPreview);
      }
  
      setMessage("");
      setNewPosterFile(file);
      setNewPosterPreview(URL.createObjectURL(file));
      setRemoveExistingPoster(false);
    }
  
    function clearNewPoster() {
      setNewPosterFile(null);
  
      if (newPosterPreview) {
        URL.revokeObjectURL(newPosterPreview);
      }
  
      setNewPosterPreview("");
    }
  
    async function uploadPoster(
      file: File,
      userId: string
    ): Promise<string> {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";
  
      const filePath =
        `${userId}/${crypto.randomUUID()}.${extension}`;
  
      const { error: uploadError } = await supabase.storage
        .from("club-posters")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
  
      if (uploadError) {
        throw uploadError;
      }
  
      const { data } = supabase.storage
        .from("club-posters")
        .getPublicUrl(filePath);
  
      return data.publicUrl;
    }
  
    async function deletePosterFromStorage(
      publicUrl: string
    ) {
      const storagePath =
        getStoragePathFromPublicUrl(publicUrl);
  
      if (!storagePath) {
        return;
      }
  
      const { error } = await supabase.storage
        .from("club-posters")
        .remove([storagePath]);
  
      if (error) {
        console.error(
          "Unable to remove old poster from storage:",
          error
        );
      }
    }
  
    async function handleSubmit(
      event: FormEvent<HTMLFormElement>
    ) {
      event.preventDefault();
      setMessage("");
  
      if (!postId) {
        setMessage("Post ID is missing.");
        return;
      }
  
      if (!clubId || !title.trim() || !startsAt) {
        setMessage(
          "Club ID, title, and start time are required."
        );
        return;
      }
  
      const capacityNumber = capacity
        ? Number(capacity)
        : 5000;
  
      if (
        !Number.isInteger(capacityNumber) ||
        capacityNumber < 1
      ) {
        setMessage(
          "Maximum RSVP capacity must be at least 1."
        );
        return;
      }
  
      if (
        postType === "poster" &&
        !existingPosterUrl &&
        !newPosterFile
      ) {
        setMessage(
          "Please choose a poster image before saving."
        );
        return;
      }
  
      setSaving(true);
  
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
  
        if (userError || !user) {
          throw new Error(
            "You must be logged in to edit this post."
          );
        }
  
        let finalPosterUrl: string | null =
          existingPosterUrl || null;
  
        if (postType === "generated") {
          finalPosterUrl = null;
        }
  
        if (postType === "poster" && newPosterFile) {
          finalPosterUrl = await uploadPoster(
            newPosterFile,
            user.id
          );
        }
  
        if (
          postType === "poster" &&
          removeExistingPoster &&
          !newPosterFile
        ) {
          finalPosterUrl = null;
        }
  
        const { error: updateError } = await supabase
          .from("club_posts")
          .update({
            club_id: Number(clubId),
            post_type: postType,
            title: title.trim(),
            description: description.trim() || null,
            location: location.trim() || null,
            starts_at: new Date(startsAt).toISOString(),
            ends_at: endsAt
              ? new Date(endsAt).toISOString()
              : null,
            poster_url: finalPosterUrl,
            registration_url:
              registrationUrl.trim() || null,
            capacity: capacityNumber,
            published,
            is_featured: isFeatured,
          })
          .eq("id", postId)
          .eq("created_by", user.id);
  
        if (updateError) {
          throw updateError;
        }
  
        const posterWasReplaced =
          Boolean(newPosterFile) &&
          Boolean(existingPosterUrl) &&
          finalPosterUrl !== existingPosterUrl;
  
        const posterWasRemoved =
          Boolean(existingPosterUrl) &&
          finalPosterUrl === null;
  
        if (posterWasReplaced || posterWasRemoved) {
          await deletePosterFromStorage(existingPosterUrl);
        }
  
        navigate("/club-dashboard");
      } catch (error) {
        console.error("Error updating club post:", error);
  
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to save your changes."
        );
      } finally {
        setSaving(false);
      }
    }
    if (loading) {
        return (
          <main className="page">
            <p className="page-subtitle">Loading post...</p>
          </main>
        );
      }
    
      return (
        <main className="page">
          <div className="page-header">
            <p className="card-eyebrow">Organization tools</p>
    
            <h1 className="page-title">Edit digital post</h1>
    
            <p className="page-subtitle">
              Update event details, capacity, visibility, and poster information.
            </p>
          </div>
    
          <form
            onSubmit={handleSubmit}
            className="card"
            style={{
              maxWidth: "760px",
              margin: "0 auto",
            }}
          >
            <fieldset
              style={{
                border: 0,
                padding: 0,
                marginBottom: "24px",
              }}
            >
              <legend
                style={{
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                Post format
              </legend>
    
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className={
                    postType === "generated"
                      ? "btn btn-primary"
                      : "btn btn-outline"
                  }
                  onClick={() => handlePostTypeChange("generated")}
                >
                  Generate event card
                </button>
    
                <button
                  type="button"
                  className={
                    postType === "poster"
                      ? "btn btn-primary"
                      : "btn btn-outline"
                  }
                  onClick={() => handlePostTypeChange("poster")}
                >
                  Use existing poster
                </button>
              </div>
            </fieldset>
    
            <label className="form-label" htmlFor="clubId">
              Club ID
            </label>
    
            <input
              id="clubId"
              className="search-input"
              type="number"
              min="1"
              value={clubId}
              onChange={(event) => setClubId(event.target.value)}
              required
            />
    
            <label className="form-label" htmlFor="postTitle">
              Event title
            </label>
    
            <input
              id="postTitle"
              className="search-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
    
            <label className="form-label" htmlFor="description">
              Description
            </label>
    
            <textarea
              id="description"
              className="search-input"
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell students what the event is about."
              style={{ resize: "vertical" }}
            />
    
            <label className="form-label" htmlFor="location">
              Location
            </label>
    
            <input
              id="location"
              className="search-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
    
            <div className="form-grid">
              <div>
                <label className="form-label" htmlFor="startsAt">
                  Starts
                </label>
    
                <input
                  id="startsAt"
                  className="search-input"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  required
                />
              </div>
    
              <div>
                <label className="form-label" htmlFor="endsAt">
                  Ends
                </label>
    
                <input
                  id="endsAt"
                  className="search-input"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </div>
            </div>
    
            <label className="form-label" htmlFor="capacity">
              Maximum RSVP capacity
            </label>
    
            <input
              id="capacity"
              className="search-input"
              type="number"
              min="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
    
            {postType === "poster" && (
              <section style={{ marginTop: "24px" }}>
                <h2
                  style={{
                    margin: "0 0 14px",
                    fontSize: "1.1rem",
                  }}
                >
                  Poster
                </h2>
    
                {existingPosterUrl && !removeExistingPoster && (
                  <div style={{ marginBottom: "22px" }}>
                    <p className="form-label">Current poster</p>
    
                    <img
                      src={existingPosterUrl}
                      alt="Current poster"
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: "420px",
                        maxHeight: "520px",
                        margin: "12px auto",
                        borderRadius: "16px",
                        objectFit: "contain",
                        border: "1px solid var(--border)",
                      }}
                    />
    
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setRemoveExistingPoster(true)}
                    >
                      Remove current poster
                    </button>
                  </div>
                )}
    
                {removeExistingPoster && existingPosterUrl && (
                  <div
                    style={{
                      marginBottom: "18px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#fbf3f5",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#98143f",
                        fontWeight: 700,
                      }}
                    >
                      Current poster will be removed.
                    </p>
    
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setRemoveExistingPoster(false)}
                    >
                      Keep current poster
                    </button>
                  </div>
                )}
    
                <label className="form-label" htmlFor="newPosterFile">
                  {existingPosterUrl
                    ? "Replace poster"
                    : "Upload poster"}
                </label>
    
                <input
                  id="newPosterFile"
                  className="search-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePosterFileChange}
                />
    
                <p
                  className="page-subtitle"
                  style={{ marginTop: "8px" }}
                >
                  PNG, JPG, or WebP. Maximum file size: 5 MB.
                </p>
    
                {newPosterPreview && (
                  <div style={{ marginTop: "18px" }}>
                    <p className="form-label">New poster preview</p>
    
                    <img
                      src={newPosterPreview}
                      alt="New poster preview"
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: "420px",
                        maxHeight: "520px",
                        margin: "12px auto",
                        borderRadius: "16px",
                        objectFit: "contain",
                        border: "1px solid var(--border)",
                      }}
                    />
    
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={clearNewPoster}
                    >
                      Clear selected poster
                    </button>
                  </div>
                )}
              </section>
            )}
    
            <label className="form-label" htmlFor="registrationUrl">
              External registration link
            </label>
    
            <input
              id="registrationUrl"
              className="search-input"
              type="url"
              value={registrationUrl}
              onChange={(event) => setRegistrationUrl(event.target.value)}
              placeholder="https://..."
            />
    
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                marginTop: "22px",
              }}
            >
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) => setPublished(event.target.checked)}
                />
                Published
              </label>
    
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                Featured on student feed
              </label>
            </div>
    
            {message && (
              <p
                role="alert"
                style={{
                  marginTop: "18px",
                  color: "#a52828",
                }}
              >
                {message}
              </p>
            )}
    
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "24px",
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
    
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/club-dashboard")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      );
    }