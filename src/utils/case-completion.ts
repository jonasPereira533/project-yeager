export interface CaseObjective {
  id: string;
}

export interface CompletableCase {
  id: string;
  objectives: readonly CaseObjective[];
}

export function isCaseComplete(
  objectives: readonly CaseObjective[],
  isSolved: (objectiveId: string) => boolean,
): boolean {
  if (objectives.length === 0) return false;
  return objectives.every((objective) => isSolved(objective.id));
}

export function isArchiveComplete(
  cases: readonly CompletableCase[],
  isSolved: (caseId: string, objectiveId: string) => boolean,
): boolean {
  if (cases.length === 0) return false;
  return cases.every((caseItem) =>
    isCaseComplete(caseItem.objectives, (objectiveId) =>
      isSolved(caseItem.id, objectiveId),
    ),
  );
}
