/**
 * screens/Login — écran de connexion du back-office Restaurateur.
 */
import { useState } from "react";
import { login, type AuthUser } from "../auth";

export function Login({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErreur(null);
    try {
      onLogin(await login(email, password));
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--cream, #efeae0)" }}>
      <form onSubmit={soumettre} className="card" style={{ width: 340, padding: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Tabla · Restaurateur</h1>
        <p style={{ color: "var(--ink-mute)", fontSize: 13, marginBottom: 20 }}>
          Accès à votre back-office
        </p>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="t-label" style={{ display: "block", marginBottom: 4 }}>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="t-label" style={{ display: "block", marginBottom: 4 }}>Mot de passe</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        {erreur && (
          <p style={{ color: "var(--terracotta)", fontSize: 13, marginBottom: 12 }}>{erreur}</p>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={busy || email === "" || password === ""}
          style={{ width: "100%" }}
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
