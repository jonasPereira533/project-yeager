const KEY_PREFIX = "yeager:certificate-name:";

/** Um nome salvo por usuario (ou por visitante), para nao misturar contas. */
export function certificateNameKey(uid: string | null | undefined): string {
  return `${KEY_PREFIX}${uid ?? "guest"}`;
}

export function readSavedName(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeSavedName(key: string, name: string): void {
  try {
    localStorage.setItem(key, name.trim());
  } catch {
    // cota cheia ou storage bloqueado: o campo pode voltar a aparecer
  }
}

/** O nome salvo pela pessoa vale mais que o nome da conta Google. */
export function resolveName(
  saved: string,
  displayName: string | null | undefined,
): string {
  return saved.trim() || displayName?.trim() || "";
}
