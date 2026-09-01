/**
 * screens/Placeholder — écran « à venir » pour les entrées de nav non branchées.
 * Assume honnêtement que l'écran fait partie du cahier mais n'est pas implémenté.
 */
export function Placeholder({ label }: { label: string }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{label}</h1>
          <p className="page-subtitle">Module du cahier des charges — non branché dans cette version.</p>
        </div>
      </div>
      <div
        className="card card-padded"
        style={{ textAlign: "center", padding: 56, color: "var(--ink-mute)", fontSize: 13 }}
      >
        Cet écran existe dans le prototype et le cahier, mais n'est pas encore
        connecté à des données réelles. Les écrans branchés sont
        <span style={{ color: "var(--ink-soft)" }}> Vue d'ensemble </span>
        et
        <span style={{ color: "var(--ink-soft)" }}> Parc NFC</span>.
      </div>
    </div>
  );
}
