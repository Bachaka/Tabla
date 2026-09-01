/**
 * components/BarsChart — histogramme SVG (taps par table).
 */
export function BarsChart({
  data,
  height = 220,
  color = "var(--terracotta)",
}: {
  data: Array<{ m: string; v: number }>;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return <p style={{ color: "var(--ink-mute)", fontSize: 13 }}>Aucune donnée pour l'instant.</p>;
  }
  const w = 600;
  const pad = { l: 32, r: 8, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.v), 1) * 1.1;
  const bw = (cw / data.length) * 0.6;
  const gap = (cw / data.length) * 0.4;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + ch * p}
            y2={pad.t + ch * p}
            stroke="var(--border-soft)"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
          <text
            x={pad.l - 6}
            y={pad.t + ch * p + 4}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--ink-mute)"
            textAnchor="end"
          >
            {Math.round(max * (1 - p))}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = (d.v / max) * ch;
        const x = pad.l + i * (bw + gap) + gap / 2;
        const y = pad.t + ch - h;
        return (
          <g key={d.m}>
            <rect x={x} y={y} width={bw} height={h} rx="3" fill={color} opacity="0.88" />
            <text x={x + bw / 2} y={height - 10} fontSize="10" fill="var(--ink-mute)" textAnchor="middle">
              {d.m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
