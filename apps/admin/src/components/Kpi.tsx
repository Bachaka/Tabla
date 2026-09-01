/**
 * components/Kpi — carte KPI au design du prototype (.kpi).
 */
export function Kpi({
  label,
  value,
  foot,
}: {
  label: string;
  value: string | number;
  foot?: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {foot && (
        <div className="kpi-foot">
          <span>{foot}</span>
        </div>
      )}
    </div>
  );
}
