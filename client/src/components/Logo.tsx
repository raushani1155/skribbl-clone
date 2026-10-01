const COLORS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#06b6d4", "#6366f1", "#d946ef"];

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <h1 className={`logo${small ? " logo--small" : ""}`} aria-label="Skribbl Clone">
      {"skribbl".split("").map((char, i) => (
        <span key={i} style={{ color: COLORS[i % COLORS.length] }}>
          {char}
        </span>
      ))}
      <em>clone</em>
    </h1>
  );
}