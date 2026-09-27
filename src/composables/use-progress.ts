import { computed, reactive, watch } from "vue";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { useCurrentUser, useDocument, useFirestore } from "vuefire";
import { CASES } from "../data/cases.ts";

const HINT_PENALTY = 5;

const guestSolvedByCase = reactive<Record<string, string[]>>({});
const guestHintsByCase = reactive<Record<string, string[]>>({});

export function useProgress() {
  const db = useFirestore();
  const user = useCurrentUser();

  const userDocRef = computed(() =>
      user.value ? doc(db, "users", user.value.uid) : null,
  );

  const { data: userDoc } = useDocument(userDocRef);

  // Migra o progresso de visitante (resolvidos + dicas usadas) assim que loga
  watch(user, async (newUser, oldUser) => {
    if (oldUser || !newUser) return;

    const hasGuestData =
        Object.keys(guestSolvedByCase).length > 0 ||
        Object.keys(guestHintsByCase).length > 0;
    if (!hasGuestData) return;

    const solvedUpdates: Record<string, ReturnType<typeof arrayUnion>> = {};
    for (const [caseId, objectiveIds] of Object.entries(guestSolvedByCase)) {
      solvedUpdates[caseId] = arrayUnion(...objectiveIds);
    }

    const hintUpdates: Record<string, ReturnType<typeof arrayUnion>> = {};
    for (const [caseId, objectiveIds] of Object.entries(guestHintsByCase)) {
      hintUpdates[caseId] = arrayUnion(...objectiveIds);
    }

    await setDoc(
        doc(db, "users", newUser.uid),
        { solvedByCase: solvedUpdates, hintsUsedByCase: hintUpdates },
        { merge: true },
    );

    Object.keys(guestSolvedByCase).forEach((key) => delete guestSolvedByCase[key]);
    Object.keys(guestHintsByCase).forEach((key) => delete guestHintsByCase[key]);
  });

  const solvedByCase = computed<Record<string, string[]>>(() =>
      user.value ? (userDoc.value?.solvedByCase ?? {}) : guestSolvedByCase,
  );

  const hintsUsedByCase = computed<Record<string, string[]>>(() =>
      user.value ? (userDoc.value?.hintsUsedByCase ?? {}) : guestHintsByCase,
  );

  function isSolved(caseId: string, objectiveId: string): boolean {
    return (solvedByCase.value[caseId] ?? []).includes(objectiveId);
  }

  function countSolved(caseId: string): number {
    return (solvedByCase.value[caseId] ?? []).length;
  }

  function isHintUsed(caseId: string, objectiveId: string): boolean {
    return (hintsUsedByCase.value[caseId] ?? []).includes(objectiveId);
  }

  async function markSolved(
      caseId: string,
      objectiveId: string,
  ): Promise<boolean> {
    if (isSolved(caseId, objectiveId)) return false;

    if (userDocRef.value) {
      await setDoc(
          userDocRef.value,
          { solvedByCase: { [caseId]: arrayUnion(objectiveId) } },
          { merge: true },
      );
    } else {
      if (!guestSolvedByCase[caseId]) guestSolvedByCase[caseId] = [];
      guestSolvedByCase[caseId].push(objectiveId);
    }
    return true;
  }

  async function useHint(caseId: string, objectiveId: string): Promise<boolean> {
    if (isHintUsed(caseId, objectiveId)) return false;

    if (userDocRef.value) {
      await setDoc(
          userDocRef.value,
          { hintsUsedByCase: { [caseId]: arrayUnion(objectiveId) } },
          { merge: true },
      );
    } else {
      if (!guestHintsByCase[caseId]) guestHintsByCase[caseId] = [];
      guestHintsByCase[caseId].push(objectiveId);
    }
    return true;
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

  const level = computed(() => Math.floor(totalXP.value / 50) + 1);

  return {
    isSolved,
    countSolved,
    markSolved,
    isHintUsed,
    useHint,
    totalXP,
    level,
  };
}