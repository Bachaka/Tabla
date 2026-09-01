/**
 * components/Kpi — carte KPI au design du prototype back-office (.kpi).
 */
export function Kpi({
  label,
  value,
  suffix,
  vs,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  vs?: string;
}) {
  return (
    <div className="kpi">
      <div className="t-label">{label}</div>
      <div className="value">
        <span>{value}</span>
        {suffix && (
          <span style={{ fontSize: 17, color: "var(--ink-mute)", fontWeight: 400 }}>{suffix}</span>
        )}
      </div>
      {vs && (
        <div className="delta" style={{ color: "var(--ink-mute)" }}>
          <span className="vs">{vs}</span>
        </div>
      )}
    </div>
  );
}
