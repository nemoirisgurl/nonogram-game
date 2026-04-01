export default function AvatarIcon({ style }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" style={{ width: "100%", height: "100%", ...style }}>
      <circle cx="60" cy="60" r="58" fill="#ffffff" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="60" cy="42" r="16" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
      <path
        d="M30 92c0-14 11-25 25-25h10c14 0 25 11 25 25"
        fill="none"
        stroke="#2b2b2b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
