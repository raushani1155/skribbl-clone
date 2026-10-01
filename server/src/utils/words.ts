import data from "../data/words.json";

const ALL_WORDS: string[] = Object.values(data as Record<string, string[]>).flat();

// Fisher-Yates on a copy, then take the first `count`
export function pickWords(count: number): string[] {
  const pool = [...ALL_WORDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}