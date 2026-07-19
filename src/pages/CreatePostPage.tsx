import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type PostType = "generated" | "poster";

export default function CreatePostPage() {
  const navigate = useNavigate();

  const [postType, setPostType] = useState<PostType>("generated");
  const [clubId, setClubId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("5000");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function handlePosterFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setPosterFile(null);
      setPosterPreview("");
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a PNG, JPG, or WebP image.");
      event.target.value = "";
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setMessage("Poster images must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setMessage("");
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  async function uploadPoster(
    file: File,
    userId: string
  ): Promise<string> {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("club-posters")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("club-posters")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const capacityNumber = capacity
      ? Number(capacity)
      : 5000;

    if (!clubId || !title.trim() || !startsAt) {
      setMessage(
        "Club ID, title, and start time are required."
      );
      return;
    }

    if (
      !Number.isInteger(capacityNumber) ||
      capacityNumber < 1
    ) {
      setMessage(
        "Maximum RSVP capacity must be at least 1."
      );
      return;
    }

    if (postType === "poster" && !posterFile) {
      setMessage("Choose a poster image.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in to create a post.");
      setSubmitting(false);
      return;
    }

    let uploadedPosterUrl: string | null = null;

    try {
      if (postType === "poster" && posterFile) {
        uploadedPosterUrl = await uploadPoster(
          posterFile,
          user.id
        );
      }

      const { error } = await supabase
        .from("club_posts")
        .insert({
          club_id: Number(clubId),
          created_by: user.id,
          post_type: postType,
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt
            ? new Date(endsAt).toISOString()
            : null,
          poster_url: uploadedPosterUrl,
          registration_url:
            registrationUrl.trim() || null,
          published: true,
          is_featured: true,
          published_at: new Date().toISOString(),
          capacity: capacityNumber,
        });

      if (error) {
        throw error;
      }

      navigate("/club-dashboard");
    } catch (error) {
      console.error("Error creating club post:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to publish the post."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <p className="card-eyebrow">Club publishing</p>

        <h1 className="page-title">
          Create a digital post
        </h1>

        <p className="page-subtitle">
          Upload an existing poster or let EagleCurrent
          generate an event card.
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
              onClick={() => setPostType("generated")}
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
              onClick={() => setPostType("poster")}
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
          onChange={(event) =>
            setClubId(event.target.value)
          }
          placeholder="Campus Labs organization ID"
          required
        />

        <label
          className="form-label"
          htmlFor="postTitle"
        >
          Event title
        </label>

        <input
          id="postTitle"
          className="search-input"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Women in Tech Panel"
          required
        />

        <label
          className="form-label"
          htmlFor="description"
        >
          Description
        </label>

        <textarea
          id="description"
          className="search-input"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Tell students what the event is about."
          rows={6}
          style={{ resize: "vertical" }}
        />

        <label
          className="form-label"
          htmlFor="location"
        >
          Location
        </label>

        <input
          id="location"
          className="search-input"
          value={location}
          onChange={(event) =>
            setLocation(event.target.value)
          }
          placeholder="Fulton 511"
        />

        <div className="form-grid">
          <div>
            <label
              className="form-label"
              htmlFor="startsAt"
            >
              Starts
            </label>

            <input
              id="startsAt"
              className="search-input"
              type="datetime-local"
              value={startsAt}
              onChange={(event) =>
                setStartsAt(event.target.value)
              }
              required
            />
          </div>

          <div>
            <label
              className="form-label"
              htmlFor="endsAt"
            >
              Ends
            </label>

            <input
              id="endsAt"
              className="search-input"
              type="datetime-local"
              value={endsAt}
              onChange={(event) =>
                setEndsAt(event.target.value)
              }
            />
          </div>
        </div>

        <label
          className="form-label"
          htmlFor="capacity"
        >
          Maximum RSVP capacity
        </label>

        <input
          id="capacity"
          className="search-input"
          type="number"
          min="1"
          value={capacity}
          onChange={(event) =>
            setCapacity(event.target.value)
          }
          placeholder="Default: 5000"
        />

        {postType === "poster" && (
          <>
            <label
              className="form-label"
              htmlFor="posterFile"
            >
              Upload poster
            </label>

            <input
              id="posterFile"
              className="search-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePosterFileChange}
              required
            />

            <p
              className="page-subtitle"
              style={{ marginTop: "8px" }}
            >
              PNG, JPG, or WebP. Maximum file size: 5 MB.
            </p>

            {posterPreview && (
              <img
                src={posterPreview}
                alt="Poster preview"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "420px",
                  maxHeight: "520px",
                  margin: "16px auto 24px",
                  borderRadius: "16px",
                  objectFit: "contain",
                  border: "1px solid var(--border)",
                }}
              />
            )}
          </>
        )}

        <label
          className="form-label"
          htmlFor="registrationUrl"
        >
          External registration link
        </label>

        <input
          id="registrationUrl"
          className="search-input"
          type="url"
          value={registrationUrl}
          onChange={(event) =>
            setRegistrationUrl(event.target.value)
          }
          placeholder="https://..."
        />

        {message && (
          <p
            role="alert"
            style={{
              marginTop: "16px",
              color: "#a52828",
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ marginTop: "24px" }}
        >
          {submitting
            ? "Publishing..."
            : "Publish post"}
        </button>
      </form>
    </main>
  );
}