export const PASTE_MAX = 5;

export function splitPasteTokens(text) {
  const raw = String(text || "").trim();
  if (!raw) return { ok: false, error: "Paste symbols", tokens: [] };
  if (!raw.includes(",") && /[\s;]/.test(raw)) {
    return { ok: false, error: "Separate symbols with commas", tokens: [] };
  }
  const tokens = raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tokens.length) return { ok: false, error: "Paste symbols", tokens: [] };
  if (tokens.length > PASTE_MAX) {
    return { ok: false, error: `Paste max ${PASTE_MAX} symbols`, tokens: [] };
  }
  return { ok: true, tokens };
}
