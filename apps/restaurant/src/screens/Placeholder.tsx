/**
 * screens/Placeholder — écran « à venir » pour les entrées de nav non branchées.
 */
export function Placeholder({ label }: { label: string }) {
  return (
    <div className="content">
      <h1 className="t-page-title">{label}</h1>
      <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>
        Module du cahier des charges — non branché dans cette version.
      </p>
      <div
        className="card"
        style={{ marginTop: 20, padding: 48, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}
      >
        Cet écran existe dans le prototype et le cahier, mais n'est pas encore
        connecté à des données réelles. L'écran branché est
        <span style={{ color: "var(--ink-soft)" }}> Tableau de bord</span>.
      </div>
    </div>
  );
}
