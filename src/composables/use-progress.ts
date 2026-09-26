import { computed, reactive, watch } from "vue";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { useCurrentUser, useDocument, useFirestore } from "vuefire";
import { CASES } from "../data/cases.ts";

const guestSolvedByCase = reactive<Record<string, string[]>>({});

export function useProgress() {
  const db = useFirestore();
  const user = useCurrentUser();

  const userDocRef = computed(() =>
      user.value ? doc(db, "users", user.value.uid) : null,
  );

  const { data: userDoc } = useDocument(userDocRef);

  // Migra o progresso de visitante assim que a pessoa loga
  watch(user, async (newUser, oldUser) => {
    if (oldUser || !newUser) return;
    if (Object.keys(guestSolvedByCase).length === 0) return;

    const updates: Record<string, ReturnType<typeof arrayUnion>> = {};
    for (const [caseId, objectiveIds] of Object.entries(guestSolvedByCase)) {
      updates[caseId] = arrayUnion(...objectiveIds);
    }

    await setDoc(
        doc(db, "users", newUser.uid),
        { solvedByCase: updates },
        { merge: true },
    );

    Object.keys(guestSolvedByCase).forEach((key) => delete guestSolvedByCase[key]);
  });

  const solvedByCase = computed(() =>
      user.value ? (userDoc.value?.solvedByCase ?? {}) : guestSolvedByCase,
  );

  function isSolved(caseId: string, objectiveId: string): boolean {
    return (solvedByCase.value[caseId] ?? []).includes(objectiveId);
  }

  function countSolved(caseId: string): number {
    return (solvedByCase.value[caseId] ?? []).length;
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

  const totalXP = computed(() => {
    let xp = 0;
    for (const c of CASES) {
      const solvedIds = solvedByCase.value[c.id] ?? [];
      for (const obj of c.objectives) {
        if (solvedIds.includes(obj.id)) xp += obj.xp;
      }
    }
    return xp;
  });

  const level = computed(() => Math.floor(totalXP.value / 50) + 1);

  return { isSolved, countSolved, markSolved, totalXP, level };
}