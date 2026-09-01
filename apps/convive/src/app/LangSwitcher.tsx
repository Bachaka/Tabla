/**
 * app/LangSwitcher — sélecteur de langue (segmenté), affiché dans le header.
 *
 * Les langues proposées viennent du RESTAURANT (data.restaurant.langues) : la
 * maison décide des langues de sa carte. On n'affiche le sélecteur que s'il y a
 * au moins deux langues (sinon il n'y a rien à choisir).
 */
import { NOM_LANGUE, useI18n, type Lang } from "../shared/i18n";

export function LangSwitcher({ langues }: { langues: string[] }) {
  const { lang, setLang } = useI18n();

  // Ne garde que les langues connues ; masque si 0 ou 1 langue.
  const dispo = langues.filter((l): l is Lang => l in NOM_LANGUE);
  if (dispo.length < 2) return null;

  return (
    <div className="lang-switch" role="group" aria-label="Langue">
      {dispo.map((l) => (
        <button
          key={l}
          className={`lang-chip${l === lang ? " active" : ""}`}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
          title={NOM_LANGUE[l]}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
