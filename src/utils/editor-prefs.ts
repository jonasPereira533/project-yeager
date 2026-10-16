export interface EditorPrefs {
  autocomplete: boolean;
}

export const DEFAULT_PREFS: EditorPrefs = { autocomplete: true };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizePrefs(raw: unknown): EditorPrefs {
  if (!isPlainObject(raw)) return { ...DEFAULT_PREFS };

  const prefs: EditorPrefs = { ...DEFAULT_PREFS };

  if (typeof raw.autocomplete === "boolean") {
    prefs.autocomplete = raw.autocomplete;
  }

  return prefs;
}

export function parsePrefs(stored: string | null): EditorPrefs {
  if (!stored) return { ...DEFAULT_PREFS };
  try {
    return sanitizePrefs(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}