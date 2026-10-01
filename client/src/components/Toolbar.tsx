import { socket } from "../lib/socket";
import type { Tool } from "../types";

const COLORS = [
  "#ffffff", "#c1c1c1", "#ef130b", "#ff7100", "#ffe400", "#00cc00",
  "#00ff91", "#00b2ff", "#231fd3", "#a300ba", "#d37caa", "#a0522d",
  "#000000", "#4c4c4c", "#740b07", "#c23800", "#e8a200", "#005510",
  "#00785d", "#00569e", "#0e0865", "#550069", "#a75574", "#63300d",
];
const SIZES = [4, 10, 20, 36];

interface Props {
  color: string;
  size: number;
  tool: Tool;
  onColor: (color: string) => void;
  onSize: (size: number) => void;
  onTool: (tool: Tool) => void;
}

export function Toolbar({ color, size, tool, onColor, onSize, onTool }: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__palette">
        {COLORS.map((c) => (
          <button
            key={c}
            aria-label={`Color ${c}`}
            className={`swatch${tool === "pen" && color === c ? " swatch--active" : ""}`}
            style={{ background: c }}
            onClick={() => {
              onColor(c);
              onTool("pen");
            }}
          />
        ))}
      </div>

      <div className="toolbar__group">
        {SIZES.map((s) => (
          <button
            key={s}
            title={`Brush ${s}px`}
            className={`size-btn${size === s ? " size-btn--active" : ""}`}
            onClick={() => onSize(s)}
          >
            <span style={{ width: Math.min(s, 26), height: Math.min(s, 26) }} />
          </button>
        ))}
      </div>

      <div className="toolbar__group">
        <button
          title="Pen"
          className={`tool-btn${tool === "pen" ? " tool-btn--active" : ""}`}
          onClick={() => onTool("pen")}
        >
          ✏️
        </button>
        <button
          title="Eraser"
          className={`tool-btn${tool === "eraser" ? " tool-btn--active" : ""}`}
          onClick={() => onTool("eraser")}
        >
          🧽
        </button>
        <button title="Undo" className="tool-btn" onClick={() => socket.emit("draw_undo")}>
          ↩️
        </button>
        <button title="Clear canvas" className="tool-btn" onClick={() => socket.emit("canvas_clear")}>
          🗑️
        </button>
      </div>
    </div>
  );
}