import type { RoomSettings } from "../types";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const FIELDS = [
  { key: "maxPlayers", label: "Players", options: range(2, 20) },
  { key: "rounds", label: "Rounds", options: range(2, 10) },
  { key: "drawTime", label: "Draw time (seconds)", options: [15, 30, 45, 60, 80, 90, 120, 150, 180, 210, 240] },
  { key: "wordCount", label: "Words to choose from", options: range(1, 5) },
  { key: "hints", label: "Hints", options: range(0, 5) },
] as const;

interface Props {
  settings: RoomSettings;
  editable: boolean;
  onChange: (settings: RoomSettings) => void;
}

export function SettingsForm({ settings, editable, onChange }: Props) {
  return (
    <div className="settings">
      {FIELDS.map((f) => (
        <label key={f.key} className="settings__row">
          <span>{f.label}</span>
          <select
            className="input"
            value={settings[f.key]}
            disabled={!editable}
            onChange={(e) => onChange({ ...settings, [f.key]: Number(e.target.value) })}
          >
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="settings__row">
        <span>Private room</span>
        <input
          type="checkbox"
          checked={settings.isPrivate}
          disabled={!editable}
          onChange={(e) => onChange({ ...settings, isPrivate: e.target.checked })}
        />
      </label>
    </div>
  );
}