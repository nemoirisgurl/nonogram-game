import { useId } from "react";

const avatarPalettes = {
  amber: { background: "#fff6db", accent: "#f0b429", stroke: "#2b2b2b" },
  mint: { background: "#e6fbf0", accent: "#2fbf71", stroke: "#1f3d2f" },
  sky: { background: "#e8f4ff", accent: "#4e8ef7", stroke: "#20314f" },
  coral: { background: "#ffe9e4", accent: "#ff7f50", stroke: "#4a241b" },
};

export default function AvatarIcon({ style, variant = "amber", initials = "", imageSrc = "" }) {
  const palette = avatarPalettes[variant] || avatarPalettes.amber;
  const clipPathId = useId();

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" style={{ width: "100%", height: "100%", ...style }}>
      <defs>
        <clipPath id={clipPathId}>
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill={palette.background} stroke={palette.stroke} strokeWidth="2" />
      {imageSrc ? (
        <image href={imageSrc} x="4" y="4" width="112" height="112" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipPathId})`} />
      ) : (
        <>
          <circle cx="60" cy="42" r="16" fill="none" stroke={palette.stroke} strokeWidth="2.5" />
          <path
            d="M30 92c0-14 11-25 25-25h10c14 0 25 11 25 25"
            fill="none"
            stroke={palette.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx="88" cy="88" r="14" fill={palette.accent} />
      {initials ? (
        <text x="60" y="108" textAnchor="middle" fontSize="18" fontWeight="800" fill={palette.stroke}>
          {initials}
        </text>
      ) : null}
    </svg>
  );
}
