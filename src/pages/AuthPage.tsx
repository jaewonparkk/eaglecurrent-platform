import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type UserRole = "student" | "club";
type AuthMode = "login" | "signup";

export default function AuthPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("student");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function saveRole(selectedRole: UserRole) {
    localStorage.setItem("role", selectedRole);
    window.dispatchEvent(new Event("rolechange"));
  }

  function navigateByRole(selectedRole: UserRole) {
    if (selectedRole === "club") {
      navigate("/club-dashboard");
    } else {
      navigate("/feed");
    }
  }

  async function handleSubmit() {
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@bc.edu")) {
      setMessage("Please use your Boston College @bc.edu email.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        saveRole(role);
        setMessage("Check your email to confirm your account.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      saveRole(role);
      navigateByRole(role);
    } catch (error) {
      console.error("Authentication failed:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === "login" ? "signup" : "login"
    );
    setMessage("");
  }

  return (
    <div className="page">
      <div
        className="card"
        style={{
          maxWidth: "420px",
          margin: "64px auto",
        }}
      >
        <div className="page-header">
          <h1 className="page-title">
            {mode === "login" ? "Log in" : "Sign up"}
          </h1>

          <p className="page-subtitle">
            Use your Boston College @bc.edu email.
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p
            className="card-meta"
            style={{
              marginBottom: "10px",
            }}
          >
            I am joining as:
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className={
                role === "student"
                  ? "btn btn-primary"
                  : "btn btn-outline"
              }
              onClick={() => setRole("student")}
            >
              Student
            </button>

            <button
              type="button"
              className={
                role === "club"
                  ? "btn btn-primary"
                  : "btn btn-outline"
              }
              onClick={() => setRole("club")}
            >
              Club / Organization
            </button>
          </div>
        </div>

        <input
          className="search-input"
          type="email"
          placeholder="yourname@bc.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit();
            }
          }}
          style={{
            marginBottom: "12px",
          }}
        />

        <input
          className="search-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit();
            }
          }}
          style={{
            marginBottom: "16px",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting
              ? mode === "login"
                ? "Logging in..."
                : "Signing up..."
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </button>

          <button
            type="button"
            onClick={toggleMode}
            className="btn btn-outline"
          >
            {mode === "login"
              ? "Need an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>

        {message && (
          <p
            className="card-meta"
            role="status"
            style={{
              marginTop: "16px",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}