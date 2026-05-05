import { useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../component/navbar";

const pageStyle = {
  width: "min(920px, 100%)",
  margin: "0 auto",
  display: "grid",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  overflow: "hidden",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
};

const panelStyle = {
  margin: "clamp(14px, 3vw, 24px)",
  padding: "30px clamp(18px, 4vw, 36px)",
  display: "grid",
  gap: "clamp(18px, 4vw, 22px)",
  background: "#d7f1ff",
  borderRadius: "clamp(16px, 3vw, 18px)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid rgba(15, 23, 42, 0.18)",
  borderRadius: 999,
  padding: "clamp(10px, 2.8vw, 12px) clamp(12px, 3vw, 14px)",
  fontSize: "clamp(0.95rem, 2.8vw, 1rem)",
  background: "#ffffff",
  color: "#111111",
  outline: "none",
};

const buttonStyle = {
  border: "none",
  borderRadius: 999,
  padding: "12px 18px",
  fontSize: "clamp(0.95rem, 3vw, 1rem)",
  fontWeight: 800,
  cursor: "pointer",
  background: "#ffca2c",
  color: "#111111",
  boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
};

const responsiveStyles = `
  .auth-page {
    width: min(920px, 100%);
    margin: 0 auto;
  }

  @media (max-width: 820px) {
    .auth-page {
      width: min(100%, calc(100% - 20px));
    }
  }

  @media (max-width: 560px) {
    .auth-page {
      width: 100%;
    }

    .auth-panel {
      padding: 22px 16px !important;
    }
  }
`;

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

async function persistProfile(userId, username) {
  try {
    await Promise.race([
      supabase.from("users").upsert(
        {
          id: userId,
          username,
          role: "guest",
        },
        { onConflict: "id" }
      ),
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("Profile sync timed out.")), 5000);
      }),
    ]);
  } catch {
    // Auth succeeded; don't block registration on the profile mirror table.
  }
}

export default function Register({ onRegister }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

      if (authData.session) {
        void persistProfile(authData.user.id, trimmedUsername);
        onRegister({
          id: authData.user.id,
          username: trimmedUsername,
          role: "guest",
          email: authData.user.email || "",
          avatarVariant: authData.user.user_metadata?.avatarVariant || "amber",
          avatarImage: "",
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
    <>
      <style>{responsiveStyles}</style>
      <section className="auth-page" style={pageStyle}>
      <Navbar />
      <section className="auth-panel" style={panelStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#111111" }}>Register</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8, color: "#111111", fontWeight: 800 }}>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#111111", fontWeight: 800 }}>
            Username
            <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#111111", fontWeight: 800 }}>
            Password
            <span style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
              <button type="button" onClick={() => setShowPassword((current) => !current)} style={{ ...buttonStyle, minWidth: 76, background: "#111111", color: "#ffffff" }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          <label style={{ display: "grid", gap: 8, color: "#111111", fontWeight: 800 }}>
            Confirm Password
            <span style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} style={{ ...buttonStyle, minWidth: 76, background: "#111111", color: "#ffffff" }}>
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          {errorMessage ? (
            <p style={{ margin: 0, borderRadius: 14, padding: "12px 14px", background: "#ffe3df", color: "#8f2313" }}>{errorMessage}</p>
          ) : null}

          <button type="submit" disabled={isSubmitting} style={{ ...buttonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={{ margin: 0, color: "#45556c" }}>
          Already have an account?{" "}
          <a href="#/login" style={{ color: "#111111", fontWeight: 800 }}>
            Sign in
          </a>
        </p>
      </section>
      </section>
    </>
  );
}
