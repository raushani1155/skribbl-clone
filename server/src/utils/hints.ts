const isLetter = (ch: string) => ch !== " " && ch !== "-";

export function buildHint(word: string, revealed: Set<number>): string {
  return [...word].map((ch, i) => (!isLetter(ch) || revealed.has(i) ? ch : "_")).join("");
}

// Never reveal more than half of the letters
export function nextHintIndex(word: string, revealed: Set<number>): number | null {
  const chars = [...word];
  const letterCount = chars.filter(isLetter).length;
  const hidden = chars.flatMap((ch, i) => (isLetter(ch) && !revealed.has(i) ? [i] : []));
  if (hidden.length === 0 || revealed.size >= Math.floor(letterCount / 2)) return null;
  return hidden[Math.floor(Math.random() * hidden.length)];
}