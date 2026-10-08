import { computed, effectScope, reactive, watch } from "vue";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { useCurrentUser, useDocument, useFirestore } from "vuefire";
import { CASES } from "../data/cases.ts";

const HINT_PENALTY = 5;

const guestSolvedByCase = reactive<Record<string, string[]>>({});
const guestHintsByCase = reactive<Record<string, string[]>>({});

const pendingSolved = new Set<string>();
const pendingHints = new Set<string>();

const progressKey = (caseId: string, objectiveId: string) =>
  `${caseId}:${objectiveId}`;

export type ProgressOutcome = "new" | "duplicate" | "error";

function createProgress() {
  const db = useFirestore();
  const user = useCurrentUser();

  const userDocRef = computed(() =>
    user.value ? doc(db, "users", user.value.uid) : null,
  );

  const { data: userDoc } = useDocument(userDocRef);

  watch(user, async (newUser, oldUser) => {
    if (oldUser || !newUser) return;

    const hasGuestData =
      Object.keys(guestSolvedByCase).length > 0 ||
      Object.keys(guestHintsByCase).length > 0;
    if (!hasGuestData) return;

    const solvedUpdates: Record<string, ReturnType<typeof arrayUnion>> = {};
    for (const [caseId, objectiveIds] of Object.entries(guestSolvedByCase)) {
      if (objectiveIds.length)
        solvedUpdates[caseId] = arrayUnion(...objectiveIds);
    }

    const hintUpdates: Record<string, ReturnType<typeof arrayUnion>> = {};
    for (const [caseId, objectiveIds] of Object.entries(guestHintsByCase)) {
      if (objectiveIds.length)
        hintUpdates[caseId] = arrayUnion(...objectiveIds);
    }

    try {
      await setDoc(
        doc(db, "users", newUser.uid),
        { solvedByCase: solvedUpdates, hintsUsedByCase: hintUpdates },
        { merge: true },
      );
    } catch (error) {
      console.error("Falha ao migrar progresso de visitante:", error);
      return;
    }

    Object.keys(guestSolvedByCase).forEach(
      (key) => delete guestSolvedByCase[key],
    );
    Object.keys(guestHintsByCase).forEach(
      (key) => delete guestHintsByCase[key],
    );
  });

  const solvedByCase = computed<Record<string, string[]>>(() =>
    user.value ? (userDoc.value?.solvedByCase ?? {}) : guestSolvedByCase,
  );

  const hintsUsedByCase = computed<Record<string, string[]>>(() =>
    user.value ? (userDoc.value?.hintsUsedByCase ?? {}) : guestHintsByCase,
  );

  function isSolved(caseId: string, objectiveId: string): boolean {
    if (pendingSolved.has(progressKey(caseId, objectiveId))) return true;
    return (solvedByCase.value[caseId] ?? []).includes(objectiveId);
  }

  function countSolved(caseId: string): number {
    return (solvedByCase.value[caseId] ?? []).length;
  }

  function isHintUsed(caseId: string, objectiveId: string): boolean {
    if (pendingHints.has(progressKey(caseId, objectiveId))) return true;
    return (hintsUsedByCase.value[caseId] ?? []).includes(objectiveId);
  }

  async function markSolved(
    caseId: string,
    objectiveId: string,
  ): Promise<ProgressOutcome> {
    if (isSolved(caseId, objectiveId)) return "duplicate";

    if (userDocRef.value) {
      const pendingKey = progressKey(caseId, objectiveId);
      pendingSolved.add(pendingKey);
      try {
        await setDoc(
          userDocRef.value,
          { solvedByCase: { [caseId]: arrayUnion(objectiveId) } },
          { merge: true },
        );
        return "new";
      } catch (error) {
        console.error("Falha ao salvar objetivo resolvido:", error);
        return "error";
      } finally {
        pendingSolved.delete(pendingKey);
      }
    }

    if (!guestSolvedByCase[caseId]) guestSolvedByCase[caseId] = [];
    guestSolvedByCase[caseId].push(objectiveId);
    return "new";
  }

  async function useHint(
    caseId: string,
    objectiveId: string,
  ): Promise<ProgressOutcome> {
    if (isHintUsed(caseId, objectiveId)) return "duplicate";

    if (userDocRef.value) {
      const pendingKey = progressKey(caseId, objectiveId);
      pendingHints.add(pendingKey);
      try {
        await setDoc(
          userDocRef.value,
          { hintsUsedByCase: { [caseId]: arrayUnion(objectiveId) } },
          { merge: true },
        );
        return "new";
      } catch (error) {
        console.error("Falha ao registrar uso de dica:", error);
        return "error";
      } finally {
        pendingHints.delete(pendingKey);
      }
    }

    if (!guestHintsByCase[caseId]) guestHintsByCase[caseId] = [];
    guestHintsByCase[caseId].push(objectiveId);
    return "new";
  }

  const totalXP = computed(() => {
    let xp = 0;
    for (const c of CASES) {
      const solvedIds = solvedByCase.value[c.id] ?? [];
      for (const obj of c.objectives) {
        if (solvedIds.includes(obj.id)) xp += obj.xp;
      }
    }

    let hintsCount = 0;
    for (const objectiveIds of Object.values(hintsUsedByCase.value)) {
      hintsCount += objectiveIds.length;
    }

    return Math.max(0, xp - hintsCount * HINT_PENALTY);
  });

  return {
    isSolved,
    countSolved,
    markSolved,
    isHintUsed,
    useHint,
    totalXP,
  };
}

type Progress = ReturnType<typeof createProgress>;

let shared: Progress | null = null;

export function useProgress(): Progress {
  if (!shared) {
    shared = effectScope(true).run(createProgress)!;
  }
  return shared;
}
