import { computed, reactive, watch } from "vue";
import { CASES } from "../data/cases.ts";

const STORAGE_KEY = "yeager_progress_v1";

function loadFromStorage(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

const solvedByCase = reactive<Record<string, string[]>>(loadFromStorage());

watch(
  solvedByCase,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);

export function useProgress() {
  function isSolved(caseId: string, objectiveId: string): boolean {
    return (solvedByCase[caseId] ?? []).includes(objectiveId);
  }

  function countSolved(caseId: string): number {
    return (solvedByCase[caseId] ?? []).length;
  }

  function markSolved(caseId: string, objectiveId: string): boolean {
    if (!solvedByCase[caseId]) solvedByCase[caseId] = [];
    if (solvedByCase[caseId].includes(objectiveId)) return false;
    solvedByCase[caseId].push(objectiveId);
    return true;
  }

  function resetAll(): void {
    Object.keys(solvedByCase).forEach((key) => delete solvedByCase[key]);
  }

  const totalXP = computed(() => {
    let xp = 0;
    for (const c of CASES) {
      const solvedIds = solvedByCase[c.id] ?? [];
      for (const obj of c.objectives) {
        if (solvedIds.includes(obj.id)) xp += obj.xp;
      }
    }
    return xp;
  });

  const level = computed(() => Math.floor(totalXP.value / 50) + 1);

  return { isSolved, countSolved, markSolved, resetAll, totalXP, level };
}
