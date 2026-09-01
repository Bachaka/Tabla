/**
 * components/crm — primitives CRM du prototype : health score, pastilles.
 */

export function HealthScore({ value }: { value: number }) {
  const color = value >= 75 ? "var(--olive)" : value >= 50 ? "var(--amber)" : "var(--terracotta)";
  const bg =
    value >= 75
      ? "rgba(74, 103, 65, 0.08)"
      : value >= 50
        ? "rgba(198, 138, 31, 0.10)"
        : "rgba(139, 58, 47, 0.08)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 4,
        background: bg,
        color,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 99, background: "currentColor" }} />
      {value}
    </span>
  );
}

const BILL: Record<string, { kind: string; label: string }> = {
  active: { kind: "olive", label: "À jour" },
  trialing: { kind: "gold", label: "Essai" },
  past_due: { kind: "terr", label: "En retard" },
  at_risk: { kind: "amber", label: "À risque" },
};

export function BillingPill({ status }: { status: string }) {
  const s = BILL[status] ?? { kind: "mute", label: status };
  return <span className={`pill pill-${s.kind}`}>{s.label.toUpperCase()}</span>;
}

export function PlanPill({ plan }: { plan: string }) {
  const k = plan === "Enterprise" ? "plan-enterprise" : plan === "Pro" ? "plan-pro" : "plan-essentiel";
  return <span className={`pill pill-${k}`}>{plan}</span>;
}
