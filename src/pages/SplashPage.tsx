import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setTimeout(() => {
        if (!user) {
          navigate("/auth");
          return;
        }

        const hasCompletedOnboarding =
          localStorage.getItem("hasCompletedOnboarding") === "true";

        if (!hasCompletedOnboarding) {
          navigate("/welcome");
          return;
        }

        navigate("/feed");
      }, 2000);
    }

    checkUser();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h1 style={{ fontSize: "48px", color: "#8b0028" }}>
        EagleCurrent
      </h1>
      <p>BC Events · Go Paperless 🌱</p>
    </div>
  );
}