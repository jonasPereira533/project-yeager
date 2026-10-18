import type { Case } from "../types/case";

export const HINT_PENALTY = 5;

export const PROGRESS_KEY_SEPARATOR = ":";

export function progressKey(caseId: string, objectiveId: string): string {
  return `${caseId}${PROGRESS_KEY_SEPARATOR}${objectiveId}`;
}

export function toProgressKeys(
  byCase: Readonly<Record<string, readonly string[] | undefined>>,
): string[] {
  const keys: string[] = [];
  for (const [caseId, objectiveIds] of Object.entries(byCase)) {
    if (!objectiveIds) continue;
    for (const objectiveId of objectiveIds) {
      keys.push(progressKey(caseId, objectiveId));
    }
  }
  return keys;
}

export function countHints(hintKeys: Iterable<string>): number {
  return new Set(hintKeys).size;
}

export function computeTotalXP(
  cases: readonly Case[],
  solvedKeys: Iterable<string>,
  hintKeys: Iterable<string>,
): number {
  const solved = new Set(solvedKeys);

  let xp = 0;
  for (const caseItem of cases) {
    for (const objective of caseItem.objectives) {
      if (solved.has(progressKey(caseItem.id, objective.id))) xp += objective.xp;
    }
  }

  return Math.max(0, xp - countHints(hintKeys) * HINT_PENALTY);
}
