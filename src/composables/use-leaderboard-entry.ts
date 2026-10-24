import { computed, effectScope, ref, watch } from "vue";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentReference,
} from "firebase/firestore";
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

interface ServerLine {
  solved: string[];
  hints: string[];
  sector: string | null;
  completedAt: unknown;
}

function describe(
  server: ServerLine | null,
  payload: LeaderboardWrite,
): Record<string, unknown> {
  return {
    servidor: server
      ? {
          solved: server.solved.length,
          hints: server.hints.length,
          sector: server.sector,
          carimbado: Boolean(server.completedAt),
        }
      : null,
    enviado: {
      solved: (payload.solved as string[]).length,
      hints: (payload.hints as string[]).length,
      setor: payload.sector ?? null,
    },
  };
}

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

  const publishError = ref<string | null>(null);

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

  function union(a: readonly string[], b: readonly string[]): string[] {
    return [...new Set([...a, ...b])];
  }

  async function readServerLine(
    ref: DocumentReference,
  ): Promise<ServerLine | null> {
    try {
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      const data = snapshot.data();
      return {
        solved: Array.isArray(data?.solved) ? data.solved : [],
        hints: Array.isArray(data?.hints) ? data.hints : [],
        sector: typeof data?.sector === "string" ? data.sector : null,
        completedAt: data?.completedAt ?? null,
      };
    } catch {
      return null;
    }
  }

  function payloadFor(
    displayName: string | null,
    server: ServerLine | null,
  ): LeaderboardWrite | null {
    const payload = basePayload(displayName);
    if (!payload) return null;

    payload.solved = union(server?.solved ?? [], payload.solved as string[]);
    payload.hints = union(server?.hints ?? [], payload.hints as string[]);

    if (server?.sector) payload.sector = server.sector;
    return payload;
  }

  async function sync() {
    const currentUser = user.value;
    if (!currentUser) return;

    if (inFlight) {
      dirty = true;
      return;
    }

    const ref = doc(db, "leaderboard", currentUser.uid);
    const server = await readServerLine(ref);
    const payload = payloadFor(currentUser.displayName, server);
    if (!payload) return;

    let stamping = pendingStamp;

    if (stamping && server?.completedAt) {
      pendingStamp = false;
      stamping = false;
    }

    if (stamping) payload.completedAt = serverTimestamp();

    inFlight = true;
    try {
      await setDoc(ref, payload, { merge: true });
      publishError.value = null;
      if (stamping) {
        pendingStamp = false;
        stampedThisSession = true;
      }
    } catch (error) {
      publishError.value =
        "Nao consegui publicar sua linha no placar. As regras do Firestore podem estar desatualizadas no ar.";
      console.error(
        "Falha ao publicar no placar:",
        error,
        describe(server, payload),
      );
      if (stamping && server?.completedAt) {
        pendingStamp = false;
        const retry = payloadFor(currentUser.displayName, server);
        if (retry) {
          await setDoc(ref, retry, { merge: true }).catch(() => undefined);
        }
      }
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

    const ref = doc(db, "leaderboard", currentUser.uid);
    const server = await readServerLine(ref);

    if (server?.sector && server.sector !== sector) {
      console.error(
        `O setor ja foi escolhido (${server.sector}) e as regras nao deixam trocar.`,
      );
      return false;
    }

    const payload = payloadFor(currentUser.displayName, server);
    if (!payload) return false;
    payload.sector = sector;

    inFlight = true;
    try {
      await setDoc(ref, payload, { merge: true });
      publishError.value = null;
      chosenSector = sector;
      return true;
    } catch (error) {
      publishError.value =
        "Nao consegui salvar seu setor. As regras do Firestore podem estar desatualizadas no ar.";
      console.error(
        "Falha ao escolher o setor:",
        error,
        describe(server, payload),
      );
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

  return { sync, chooseSector, archiveComplete, publishError };
}

type LeaderboardEntryApi = ReturnType<typeof createLeaderboardEntry>;

let shared: LeaderboardEntryApi | null = null;

export function useLeaderboardEntry(): LeaderboardEntryApi {
  if (!shared) {
    shared = effectScope(true).run(createLeaderboardEntry)!;
  }
  return shared;
}
