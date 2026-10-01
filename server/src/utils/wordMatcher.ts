// Case-insensitive, accent-insensitive, whitespace-tolerant comparison
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function isCorrect(guess: string, word: string): boolean {
  return normalize(guess) === normalize(word);
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// "Close" means one edit away, only for words long enough to make that meaningful
export function isClose(guess: string, word: string): boolean {
  const g = normalize(guess);
  const w = normalize(word);
  if (g === w || w.length < 4) return false;
  return levenshtein(g, w) <= 1;
}