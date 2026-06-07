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

      navigate("/");
    }
  }

  return (
    <div style={{ padding: "32px" }}>
      <h1>{mode === "login" ? "Log in" : "Sign up"}</h1>

      <input
        type="email"
        placeholder="yourname@bc.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleSubmit}>
        {mode === "login" ? "Log in" : "Sign up"}
      </button>

      <br />
      <br />

      <button
        onClick={() =>
          setMode(mode === "login" ? "signup" : "login")
        }
      >
        {mode === "login"
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}