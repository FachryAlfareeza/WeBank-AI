import type { Merchant } from "@/types/dashboard";

interface Props {
  merchants: Merchant[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** Switches the active demo merchant (no real auth — a demo account picker). */
export function MerchantSwitcher({ merchants, activeId, onSelect }: Props) {
  return (
    <div className="switcher">
      <label className="switcher__label" htmlFor="merchant-select">
        Signed in as
      </label>
      <select
        id="merchant-select"
        className="switcher__select"
        value={activeId}
        onChange={(e) => onSelect(e.target.value)}
      >
        {merchants.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
