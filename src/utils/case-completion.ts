export interface CaseObjective {
  id: string;
}

export function isCaseComplete(
  objectives: readonly CaseObjective[],
  isSolved: (objectiveId: string) => boolean,
): boolean {
  if (objectives.length === 0) return false;
  return objectives.every((objective) => isSolved(objective.id));
}