/**
 * app/TabBar — navigation basse (design du prototype).
 */
import { BookOpen, Users } from "lucide-react";
import { useI18n } from "../shared/i18n";

const TABS = [
  { id: "menu", cle: "tab_menu", Icon: BookOpen },
  { id: "producers", cle: "tab_producers", Icon: Users },
] as const;

export function TabBar({
  current,
  onChange,
}: {
  current: string;
  onChange: (id: string) => void;
}) {
  const { tm } = useI18n();
  return (
    <nav className="tabbar" aria-label="Navigation">
      {TABS.map((tb) => (
        <button
          key={tb.id}
          aria-current={current === tb.id ? "page" : undefined}
          onClick={() => onChange(tb.id)}
        >
          <tb.Icon size={22} strokeWidth={current === tb.id ? 1.8 : 1.5} />
          <span className="tab-label">{tm(tb.cle)}</span>
        </button>
      ))}
    </nav>
  );
}
