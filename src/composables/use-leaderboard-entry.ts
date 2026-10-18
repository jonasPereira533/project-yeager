import { computed, effectScope, watch } from "vue";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useCurrentUser, useFirestore } from "vuefire";
import { CASES } from "../data/cases";
import { useProgress } from "./use-progress";
import { useArchiveCelebration } from "./use-archive-celebration";
import { isArchiveComplete } from "../utils/case-completion";
import { progressKey } from "../utils/xp";
import {
  LEADERBOARD_FIELDS,
  firstName,
  shouldStampCompletion,
  type Sector,
} from "../utils/ranking";

const SYNC_DEBOUNCE_MS = 1500;

type LeaderboardWrite = Partial<
  Record<(typeof LEADERBOARD_FIELDS)[number], unknown>
>;

function createLeaderboardEntry() {
  const db = useFirestore();
  const user = useCurrentUser();
  const { isSolved, isHintUsed } = useProgress();
  const { celebrated } = useArchiveCelebration();

  function snapshotKeys(): { solved: string[]; hints: string[] } {
    const solved: string[] = [];
    const hints: string[] = [];
    for (const caseItem of CASES) {
      for (const objective of caseItem.objectives) {
        if (isSolved(caseItem.id, objective.id)) {
          solved.push(progressKey(caseItem.id, objective.id));
        }
        if (isHintUsed(caseItem.id, objective.id)) {
          hints.push(progressKey(caseItem.id, objective.id));
        }
      }
    }
    return { solved, hints };
  }

  const archiveComplete = computed(() =>
    isArchiveComplete(CASES, (caseId, objectiveId) =>
      isSolved(caseId, objectiveId),
    ),
  );

  const progressSignature = computed(() => {
    if (!user.value) return "";
    const { solved, hints } = snapshotKeys();
    return `${solved.length}:${hints.length}`;
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let dirty = false;

  let pendingStamp = false;
  let stampedThisSession = false;

  let chosenSector: Sector | null = null;

  function basePayload(displayName: string | null): LeaderboardWrite | null {
    const { solved, hints } = snapshotKeys();
    if (solved.length === 0) return null;

    const payload: LeaderboardWrite = {
      displayName: firstName(displayName),
      solved,
      hints,
      updatedAt: serverTimestamp(),
    };
    if (chosenSector) payload.sector = chosenSector;
    return payload;
  }

  async function sync() {
    const currentUser = user.value;
    if (!currentUser) return;

    if (inFlight) {
      dirty = true;
      return;
    }

    const payload = basePayload(currentUser.displayName);
    if (!payload) return;

    const stamping = pendingStamp;
    if (stamping) payload.completedAt = serverTimestamp();

    inFlight = true;
    try {
      await setDoc(doc(db, "leaderboard", currentUser.uid), payload, {
        merge: true,
      });
      if (stamping) {
        pendingStamp = false;
        stampedThisSession = true;
      }
    } catch (error) {
      console.error("Falha ao publicar no placar:", error);
    } finally {
      inFlight = false;
      if (dirty) {
        dirty = false;
        scheduleSync();
      }
    }
  }

  async function chooseSector(sector: Sector) {
    const currentUser = user.value;
    if (!currentUser || inFlight) return false;

    const payload = basePayload(currentUser.displayName);
    if (!payload) return false;
    payload.sector = sector;

    inFlight = true;
    try {
      await setDoc(doc(db, "leaderboard", currentUser.uid), payload, {
        merge: true,
      });
      chosenSector = sector;
      return true;
    } catch (error) {
      console.error("Falha ao escolher o setor:", error);
      return false;
    } finally {
      inFlight = false;
    }
  }

  function scheduleSync() {
    if (!user.value) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void sync();
    }, SYNC_DEBOUNCE_MS);
  }

  watch(progressSignature, scheduleSync, { immediate: true });

  watch(
    () => [archiveComplete.value, celebrated.value] as const,
    ([complete, hasCelebrated]) => {
      if (
        !shouldStampCompletion({
          archiveComplete: complete,
          celebratedOnDevice: hasCelebrated,
          stampedThisSession,
        })
      ) {
        return;
      }
      pendingStamp = true;
      void sync();
    },
  );

  return { sync, chooseSector, archiveComplete };
}

type LeaderboardEntryApi = ReturnType<typeof createLeaderboardEntry>;

let shared: LeaderboardEntryApi | null = null;

export function useLeaderboardEntry(): LeaderboardEntryApi {
  if (!shared) {
    shared = effectScope(true).run(createLeaderboardEntry)!;
  }
  return shared;
}
