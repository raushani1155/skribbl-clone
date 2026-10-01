const collapse = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

export const cleanName = (value: unknown) => collapse(value).slice(0, 18);
export const cleanText = (value: unknown) => collapse(value).slice(0, 100);