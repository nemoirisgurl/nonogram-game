import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const pageStyle = {
  width: "min(1080px, 100%)",
  margin: "0 auto",
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1.05fr) minmax(320px, 0.95fr)",
  background: "#f7f2ea",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow: "0 24px 60px rgba(46, 36, 24, 0.18)",
};

const showcaseStyle = {
  position: "relative",
  minHeight: 420,
  background: "linear-gradient(160deg, #f4c34a 0%, #ec8f37 42%, #e15b2d 100%)",
  padding: "clamp(28px, 5vw, 54px)",
  display: "grid",
  alignContent: "space-between",
  gap: 24,
};

const panelStyle = {
  padding: "clamp(28px, 5vw, 54px)",
  display: "grid",
  alignContent: "center",
  gap: 18,
  background: "#fffdf8",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(38, 29, 18, 0.16)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: "1rem",
  background: "#ffffff",
  color: "#1f170f",
};

const buttonStyle = {
  border: "none",
  borderRadius: 999,
  padding: "14px 18px",
  fontSize: "1rem",
  fontWeight: 800,
  cursor: "pointer",
  background: "#1f170f",
  color: "#fff8ec",
};

function normalizeErrorMessage(error) {
  if (!error) {
    return "Something went wrong.";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || "Something went wrong.";
}

function isAuthLockError(error) {
  const message = error?.message || "";
  return message.includes("NavigatorLockAcquireTimeoutError") || message.includes("another request stole it");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withTimeout(promise, message, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export default function Login({ currentUser, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const statusText = useMemo(() => {
    if (currentUser) {
      return `Signed in as ${currentUser.username}`;
    }

    return "Enter your account credentials to continue.";
  }, [currentUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let authResult = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authResult.error && isAuthLockError(authResult.error)) {
        await wait(600);
        authResult = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      const { data: authData, error: authError } = authResult;

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Unable to load authenticated user.");
      }

      let profile = null;

      try {
        const { data: profileData, error: profileError } = await withTimeout(
          supabase
            .from("users")
            .select("id, username, role")
            .eq("id", authData.user.id)
            .maybeSingle(),
          "Loading profile took too long."
        );

        if (profileError) {
          throw profileError;
        }

        profile = profileData;
      } catch {
        profile = null;
      }

      onLogin({
        id: authData.user.id,
        email: authData.user.email || "",
        username: profile?.username || authData.user.user_metadata?.username || authData.user.email || "Player",
        role: profile?.role || "guest",
        avatarVariant: authData.user.user_metadata?.avatarVariant || "amber",
      });
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={pageStyle}>
      <aside style={showcaseStyle}>
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.22em", color: "#fff5d6" }}>NONOGRAMMER</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.1rem, 6vw, 4.2rem)", lineHeight: 0.94, color: "#1c130b" }}>
            Login
            <br />
            your account.
          </h1>
          <p style={{ margin: 0, maxWidth: 360, fontSize: "1rem", lineHeight: 1.6, color: "rgba(28, 19, 11, 0.82)" }}>
            A simple sign-in screen using your email and password, styled from the auth mockup.
          </p>
        </div>

        <div
          style={{
            justifySelf: "center",
            width: "min(100%, 420px)",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 18px 34px rgba(28, 19, 11, 0.18)",
            background: "#fef4d5",
          }}
        >
        </div>
      </aside>

      <section style={panelStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, color: "#8a6845", fontWeight: 700, letterSpacing: "0.14em", fontSize: "0.76rem" }}>WELCOME BACK</p>
          <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#1f170f" }}>Login</h2>
          <p style={{ margin: 0, color: "#6f5d4a", lineHeight: 1.6 }}>{statusText}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8, color: "#2d241b", fontWeight: 700 }}>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pixel@example.com" style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#2d241b", fontWeight: 700 }}>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" style={inputStyle} />
          </label>

          {errorMessage ? (
            <p style={{ margin: 0, borderRadius: 14, padding: "12px 14px", background: "#ffe3df", color: "#8f2313" }}>{errorMessage}</p>
          ) : null}

          <button type="submit" disabled={isSubmitting} style={{ ...buttonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Checking account..." : "Login"}
          </button>
        </form>

        <p style={{ margin: 0, color: "#6f5d4a" }}>
          No account yet?{" "}
          <a href="#/register" style={{ color: "#1f170f", fontWeight: 800 }}>
            Create one
          </a>
        </p>
      </section>
    </section>
  );
}
