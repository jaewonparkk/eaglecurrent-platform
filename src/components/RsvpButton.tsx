import {
    useCallback,
    useEffect,
    useState,
  } from "react";
  import { useNavigate } from "react-router-dom";
  import { supabase } from "../lib/supabase";
  
  type RsvpButtonProps = {
    eventId?: string;
    clubPostId?: string;
    capacity?: number | null;
  };
  
  type UserRole = "student" | "club" | null;
  
  function readRole(): UserRole {
    const savedRole = localStorage.getItem("role");
  
    if (
      savedRole === "student" ||
      savedRole === "club"
    ) {
      return savedRole;
    }
  
    return null;
  }
  
  export default function RsvpButton({
    eventId,
    clubPostId,
    capacity = 5000,
  }: RsvpButtonProps) {
    const navigate = useNavigate();
  
    const [role, setRole] =
      useState<UserRole>(readRole);
  
    const [userId, setUserId] =
      useState<string | null>(null);
  
    const [isRsvped, setIsRsvped] =
      useState(false);
  
    const [rsvpCount, setRsvpCount] =
      useState(0);
  
    const [working, setWorking] =
      useState(false);
  
    const capacityLimit =
      typeof capacity === "number" && capacity > 0
        ? capacity
        : 5000;
  
    const isFull = rsvpCount >= capacityLimit;
  
    const progressPercentage = Math.min(
      100,
      (rsvpCount / capacityLimit) * 100
    );
  
    const remainingSpots = Math.max(
      0,
      capacityLimit - rsvpCount
    );
  
    const loadRsvpCount = useCallback(async () => {
      if (!eventId && !clubPostId) {
        return;
      }
  
      const { data, error } = await supabase.rpc(
        "get_rsvp_count",
        {
          target_event_id: eventId
            ? String(eventId)
            : null,
          target_club_post_id:
            clubPostId ?? null,
        }
      );
  
      if (error) {
        console.error(
          "Unable to load RSVP count:",
          error
        );
        return;
      }
  
      setRsvpCount(Number(data ?? 0));
    }, [eventId, clubPostId]);
  
    const loadUserRsvpStatus = useCallback(
      async (currentUserId: string) => {
        let query = supabase
          .from("rsvps")
          .select("id")
          .eq("user_id", currentUserId);
  
        if (eventId) {
          query = query
            .eq("event_id", String(eventId))
            .is("club_post_id", null);
        } else if (clubPostId) {
          query = query
            .eq("club_post_id", clubPostId)
            .is("event_id", null);
        } else {
          return;
        }
  
        const { data, error } =
          await query.maybeSingle();
  
        if (error) {
          console.error(
            "Unable to load RSVP status:",
            error
          );
          return;
        }
  
        setIsRsvped(Boolean(data));
      },
      [eventId, clubPostId]
    );
  
    useEffect(() => {
      function updateRole() {
        setRole(readRole());
      }
  
      window.addEventListener(
        "rolechange",
        updateRole
      );
  
      return () => {
        window.removeEventListener(
          "rolechange",
          updateRole
        );
      };
    }, []);
  
    useEffect(() => {
      async function loadInitialData() {
        if (!eventId && !clubPostId) {
          console.error(
            "RsvpButton requires eventId or clubPostId."
          );
          return;
        }
  
        await loadRsvpCount();
  
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
  
        if (error) {
          console.error(
            "Unable to load session:",
            error
          );
          return;
        }
  
        const currentUser = session?.user;
  
        if (!currentUser) {
          setUserId(null);
          setIsRsvped(false);
          return;
        }
  
        setUserId(currentUser.id);
  
        if (role === "student") {
          await loadUserRsvpStatus(
            currentUser.id
          );
        } else {
          setIsRsvped(false);
        }
      }
  
      loadInitialData();
    }, [
      eventId,
      clubPostId,
      role,
      loadRsvpCount,
      loadUserRsvpStatus,
    ]);
  
    useEffect(() => {
      if (!eventId && !clubPostId) {
        return;
      }
  
      const channelName = eventId
        ? `rsvp-event-${eventId}`
        : `rsvp-club-post-${clubPostId}`;
  
      const filter = eventId
        ? `event_id=eq.${String(eventId)}`
        : `club_post_id=eq.${clubPostId}`;
  
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rsvps",
            filter,
          },
          () => {
            loadRsvpCount();
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }, [
      eventId,
      clubPostId,
      loadRsvpCount,
    ]);
  
    async function handleRsvp() {
      if (!eventId && !clubPostId) {
        return;
      }
  
      if (role !== "student") {
        return;
      }
  
      if (!userId) {
        const shouldLogin = window.confirm(
          "You must log in before you can RSVP. Go to the login page?"
        );
  
        if (shouldLogin) {
          navigate("/auth");
        }
  
        return;
      }
  
      if (!isRsvped && isFull) {
        alert(
          "This event has reached its RSVP capacity."
        );
        return;
      }
  
      setWorking(true);
  
      try {
        if (isRsvped) {
          let deleteQuery = supabase
            .from("rsvps")
            .delete()
            .eq("user_id", userId);
  
          if (eventId) {
            deleteQuery = deleteQuery
              .eq("event_id", String(eventId))
              .is("club_post_id", null);
          } else if (clubPostId) {
            deleteQuery = deleteQuery
              .eq(
                "club_post_id",
                clubPostId
              )
              .is("event_id", null);
          }
  
          const { error } =
            await deleteQuery;
  
          if (error) {
            throw error;
          }
  
          setIsRsvped(false);
          setRsvpCount((currentCount) =>
            Math.max(0, currentCount - 1)
          );
        } else {
          const { error } = await supabase
            .from("rsvps")
            .insert({
              user_id: userId,
              event_id: eventId
                ? String(eventId)
                : null,
              club_post_id:
                clubPostId ?? null,
            });
  
          if (error) {
            throw error;
          }
  
          setIsRsvped(true);
          setRsvpCount(
            (currentCount) =>
              currentCount + 1
          );
        }
  
        await loadRsvpCount();
      } catch (error) {
        console.error(
          "RSVP operation failed:",
          error
        );
  
        alert(
          error instanceof Error
            ? error.message
            : "Unable to update your RSVP."
        );
  
        await loadRsvpCount();
  
        if (userId) {
          await loadUserRsvpStatus(userId);
        }
      } finally {
        setWorking(false);
      }
    }
  
    if (role === "club") {
      return (
        <div className="rsvp-section">
          <div className="rsvp-summary">
            <span className="rsvp-count">
              {rsvpCount} / {capacityLimit} students RSVP’d
            </span>
  
            <span className="rsvp-spots">
              {isFull
                ? "Event full"
                : `${remainingSpots} spots remaining`}
            </span>
          </div>
  
          <div
            className="rsvp-progress-track"
            aria-label={`${rsvpCount} of ${capacityLimit} RSVP spots filled`}
          >
            <div
              className="rsvp-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      );
    }
  
    return (
      <div className="rsvp-section">
        <div className="rsvp-summary">
          <span className="rsvp-count">
            {rsvpCount} / {capacityLimit} going
          </span>
  
          <span className="rsvp-spots">
            {isFull
              ? "Event full"
              : `${remainingSpots} spots left`}
          </span>
        </div>
  
        <div
          className="rsvp-progress-track"
          aria-label={`${rsvpCount} of ${capacityLimit} RSVP spots filled`}
        >
          <div
            className="rsvp-progress-fill"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>
  
        <button
          type="button"
          className={
            isRsvped
              ? "btn btn-outline"
              : "btn btn-primary"
          }
          onClick={handleRsvp}
          disabled={
            working ||
            (!isRsvped && isFull)
          }
        >
          {working
            ? "Saving..."
            : isRsvped
            ? "Cancel RSVP"
            : isFull
            ? "Full"
            : "RSVP"}
        </button>
      </div>
    );
  }