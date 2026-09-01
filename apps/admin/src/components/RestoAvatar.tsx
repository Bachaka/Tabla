/**
 * components/RestoAvatar — pastille d'initiales colorée par le nom (du proto).
 */
const SHADES = [
  { bg: "rgba(139, 58, 47, 0.12)", fg: "var(--terracotta)" },
  { bg: "rgba(74, 103, 65, 0.12)", fg: "var(--olive)" },
  { bg: "rgba(176, 141, 87, 0.18)", fg: "var(--gold)" },
  { bg: "var(--cream)", fg: "var(--ink-soft)" },
];

export function RestoAvatar({ name, size = 18 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const s = SHADES[h % SHADES.length]!;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        background: s.bg,
        color: s.fg,
        display: "inline-grid",
        placeItems: "center",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.04,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
