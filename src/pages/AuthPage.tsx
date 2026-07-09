import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    setMessage("");

    if (!email.endsWith("@bc.edu")) {
      setMessage("Please use your Boston College @bc.edu email.");
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      navigate("/feed");
    }
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: "420px", margin: "64px auto" }}>
        <div className="page-header">
          <h1 className="page-title">
            {mode === "login" ? "Log in" : "Sign up"}
          </h1>
          <p className="page-subtitle">
            Use your Boston College @bc.edu email.
          </p>
        </div>
  
        <input
          className="search-input"
          type="email"
          placeholder="yourname@bc.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: "12px" }}
        />
  
        <input
          className="search-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: "16px" }}
        />
  
        <button onClick={handleSubmit} className="btn btn-primary">
          {mode === "login" ? "Log in" : "Sign up"}
        </button>
  
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="btn btn-outline"
          style={{ marginLeft: "10px" }}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
  
        {message && (
          <p className="card-meta" style={{ marginTop: "16px" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}