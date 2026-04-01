import { useState } from "react";
import { supabase } from "../lib/supabase";

const pageStyle = {
  width: "min(1080px, 100%)",
  margin: "0 auto",
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "minmax(320px, 0.95fr) minmax(280px, 1.05fr)",
  background: "#f7f2ea",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow: "0 24px 60px rgba(46, 36, 24, 0.18)",
};

const panelStyle = {
  padding: "clamp(28px, 5vw, 54px)",
  display: "grid",
  alignContent: "center",
  gap: 18,
  background: "#fffdf8",
};

const showcaseStyle = {
  minHeight: 420,
  background: "radial-gradient(circle at top, #2e7a55 0%, #1c5a3c 38%, #103322 100%)",
  padding: "clamp(28px, 5vw, 54px)",
  display: "grid",
  alignContent: "space-between",
  gap: 24,
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
  background: "#1c5a3c",
  color: "#eff9f1",
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

export default function Register({ onRegister }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !trimmedUsername || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data: existingUser, error: existingUserError } = await withTimeout(
        supabase
          .from("users")
          .select("id")
          .eq("username", trimmedUsername)
          .maybeSingle(),
        "Checking username took too long."
      );

      if (existingUserError) {
        throw existingUserError;
      }

      if (existingUser) {
        throw new Error("Username already exists.");
      }

      let authResult = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username: trimmedUsername,
            avatarVariant: "amber",
          },
        },
      });

      if (authResult.error && isAuthLockError(authResult.error)) {
        await wait(600);
        authResult = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              username: trimmedUsername,
              avatarVariant: "amber",
            },
          },
        });
      }

      const { data: authData, error: authError } = authResult;

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Unable to create authenticated user.");
      }

      const { data, error } = await withTimeout(
        supabase
          .from("users")
          .insert({
            id: authData.user.id,
            username: trimmedUsername,
            role: "guest",
          })
          .select("id, username, role")
          .single(),
        "Creating profile took too long."
      );

      if (error) {
        throw error;
      }

      if (authData.session) {
        onRegister({
          ...data,
          email: authData.user.email || "",
          avatarVariant: authData.user.user_metadata?.avatarVariant || "amber",
        });
        return;
      }

      window.location.hash = "#/login";
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={pageStyle}>
      <section style={panelStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, color: "#5a7c64", fontWeight: 700, letterSpacing: "0.14em", fontSize: "0.76rem" }}>NEW ACCOUNT</p>
          <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#1f170f" }}>Register</h2>
          <p style={{ margin: 0, color: "#6f5d4a", lineHeight: 1.6 }}>
            Create your account with email, username, password, and password confirmation.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8, color: "#2d241b", fontWeight: 700 }}>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pixel@example.com" style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#2d241b", fontWeight: 700 }}>
            Username
            <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="grid_architect" style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#2d241b", fontWeight: 700 }}>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#2d241b", fontWeight: 700 }}>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat the password"
              style={inputStyle}
            />
          </label>

          {errorMessage ? (
            <p style={{ margin: 0, borderRadius: 14, padding: "12px 14px", background: "#ffe3df", color: "#8f2313" }}>{errorMessage}</p>
          ) : null}

          <button type="submit" disabled={isSubmitting} style={{ ...buttonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={{ margin: 0, color: "#6f5d4a" }}>
          Already have an account?{" "}
          <a href="#/login" style={{ color: "#1c5a3c", fontWeight: 800 }}>
            Sign in
          </a>
        </p>
      </section>

      <aside style={showcaseStyle}>
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.22em", color: "#dff6e7" }}>NONOGRAMMER</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.1rem, 6vw, 4.2rem)", lineHeight: 0.94, color: "#ecfff4" }}>
            Register
            <br />
            new account.
          </h1>
          <p style={{ margin: 0, maxWidth: 360, fontSize: "1rem", lineHeight: 1.6, color: "rgba(236, 255, 244, 0.86)" }}>
            The layout follows the auth mockup and keeps the form straightforward for testing.
          </p>
        </div>

        <div
          style={{
            justifySelf: "center",
            width: "min(100%, 420px)",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 18px 34px rgba(7, 22, 15, 0.26)",
            background: "#d8f2e0",
          }}
        >
        </div>
      </aside>
    </section>
  );
}
