import { AVATARS, AVATAR_COLORS } from "../lib/avatars";

interface Props {
  index: number;
  size?: number;
}

export function Avatar({ index, size = 40 }: Props) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.6,
        background: AVATAR_COLORS[index % AVATAR_COLORS.length],
      }}
    >
      {AVATARS[index % AVATARS.length]}
    </span>
  );
}