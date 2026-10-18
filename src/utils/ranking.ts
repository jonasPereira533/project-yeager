import type { Case } from "../types/case";
import { isArchiveComplete, isCaseComplete } from "./case-completion";
import { computeTotalXP, countHints, progressKey } from "./xp";

export const SECTORS = [
  "Partner",
  "Final",
  "Prime",
  "Implantação",
  "Outro",
] as const;

export type Sector = (typeof SECTORS)[number];

export interface LeaderboardSource {
  uid: string;
  displayName: string;
  solved: readonly string[];
  hints: readonly string[];
  completedAtMillis: number | null;
  sector: string | null;
}

export interface CompletionStamp {
  uid: string;
  completedAtMillis: number | null;
}

export interface RankEntry {
  uid: string;
  name: string;
  xp: number;
  hintsUsed: number;
  objectivesSolved: number;
  casesSolved: number;
  archiveComplete: boolean;
  withoutHints: boolean;
  completedAtMillis: number | null;
  rank: number;
}

export type RankBadge = "first" | "gold" | "silver" | "bronze" | "noHints";

export const MAX_DISPLAY_NAME_LENGTH = 40;

export const LEADERBOARD_FIELDS = [
  "displayName",
  "solved",
  "hints",
  "sector",
  "completedAt",
  "updatedAt",
] as const;

const FALLBACK_NAME = "Agente";

export const BADGE_LABELS: Record<RankBadge, string> = {
  first: "PRIMEIRO A FECHAR A FILA",
  gold: "1º LUGAR",
  silver: "2º LUGAR",
  bronze: "3º LUGAR",
  noHints: "SEM NENHUMA DICA",
};

export function firstName(displayName: string | null | undefined): string {
  const normalized = (displayName ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return FALLBACK_NAME;
  return normalized.split(" ")[0].slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export function withoutStaff(
  sources: readonly LeaderboardSource[],
  staffUids: ReadonlySet<string>,
): LeaderboardSource[] {
  return sources.filter((source) => !staffUids.has(source.uid));
}

export function buildRankEntry(
  source: LeaderboardSource,
  cases: readonly Case[],
): Omit<RankEntry, "rank"> {
  const solved = new Set(source.solved);
  const isSolved = (caseId: string, objectiveId: string) =>
    solved.has(progressKey(caseId, objectiveId));

  const archiveComplete = isArchiveComplete(cases, isSolved);
  const hintsUsed = countHints(source.hints);

  let objectivesSolved = 0;
  for (const caseItem of cases) {
    for (const objective of caseItem.objectives) {
      if (isSolved(caseItem.id, objective.id)) objectivesSolved += 1;
    }
  }

  return {
    uid: source.uid,
    name: firstName(source.displayName),
    xp: computeTotalXP(cases, solved, source.hints),
    hintsUsed,
    objectivesSolved,
    casesSolved: cases.filter((caseItem) =>
      isCaseComplete(caseItem.objectives, (objectiveId) =>
        isSolved(caseItem.id, objectiveId),
      ),
    ).length,
    archiveComplete,
    withoutHints: archiveComplete && hintsUsed === 0,
    completedAtMillis: source.completedAtMillis,
  };
}

function compareEntries(a: Omit<RankEntry, "rank">, b: Omit<RankEntry, "rank">) {
  if (a.xp !== b.xp) return b.xp - a.xp;

  if (a.completedAtMillis !== b.completedAtMillis) {
    if (a.completedAtMillis === null) return 1;
    if (b.completedAtMillis === null) return -1;
    return a.completedAtMillis - b.completedAtMillis;
  }

  if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
  if (a.name !== b.name) return a.name.localeCompare(b.name, "pt-BR");
  return a.uid.localeCompare(b.uid);
}

export function rankEntries(
  sources: readonly LeaderboardSource[],
  cases: readonly Case[],
): RankEntry[] {
  return sources
    .map((source) => buildRankEntry(source, cases))
    .sort(compareEntries)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function firstFinisherUid(
  sources: readonly CompletionStamp[],
): string | null {
  let bestUid: string | null = null;
  let bestMillis = Number.POSITIVE_INFINITY;

  for (const source of sources) {
    if (source.completedAtMillis === null) continue;
    if (
      source.completedAtMillis < bestMillis ||
      (source.completedAtMillis === bestMillis &&
        (bestUid === null || source.uid < bestUid))
    ) {
      bestMillis = source.completedAtMillis;
      bestUid = source.uid;
    }
  }

  return bestUid;
}

export function shouldStampCompletion(state: {
  archiveComplete: boolean;
  celebratedOnDevice: boolean;
  stampedThisSession: boolean;
}): boolean {
  return (
    state.archiveComplete &&
    !state.celebratedOnDevice &&
    !state.stampedThisSession
  );
}

export function badgesFor(
  entry: RankEntry,
  firstUid: string | null,
): RankBadge[] {
  const badges: RankBadge[] = [];

  if (firstUid !== null && entry.uid === firstUid) badges.push("first");

  if (entry.rank === 1) badges.push("gold");
  else if (entry.rank === 2) badges.push("silver");
  else if (entry.rank === 3) badges.push("bronze");

  if (entry.withoutHints) badges.push("noHints");

  return badges;
}
