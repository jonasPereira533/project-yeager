import { computed, effectScope, ref } from "vue";
import { collection } from "firebase/firestore";
import { useCollection, useCurrentUser, useFirestore } from "vuefire";
import { CASES } from "../data/cases";
import {
  SECTORS,
  firstFinisherUid,
  rankEntries,
  withoutStaff,
  type LeaderboardSource,
  type RankEntry,
  type Sector,
} from "../utils/ranking";

export const RANKING_LIMIT = 20;

interface LeaderboardDoc {
  displayName?: string;
  solved?: string[];
  hints?: string[];
  sector?: string;
  completedAt?: { toMillis?: () => number } | null;
}

function toMillis(value: LeaderboardDoc["completedAt"]): number | null {
  if (!value || typeof value.toMillis !== "function") return null;
  return value.toMillis();
}

function createRanking() {
  const db = useFirestore();
  const user = useCurrentUser();

  const { data: docs } = useCollection(collection(db, "leaderboard"));
  const { data: devDocs } = useCollection(collection(db, "devs"));

  const activeSector = ref<Sector>(SECTORS[0]);

  const sources = computed<LeaderboardSource[]>(() =>
      (docs.value ?? []).map((entry) => {
        const data = entry as LeaderboardDoc;
        return {
          uid: entry.id,
          displayName: data.displayName ?? "",
          solved: data.solved ?? [],
          hints: data.hints ?? [],
          completedAtMillis: toMillis(data.completedAt),
          sector: data.sector ?? null,
        };
      }),
  );

  const staffUids = computed(
      () => new Set((devDocs.value ?? []).map((entry) => entry.id)),
  );

  const rankable = computed(() => withoutStaff(sources.value, staffUids.value));

  const sectorList = computed(() =>
      rankable.value.filter((source) => source.sector === activeSector.value),
  );

  const entries = computed<RankEntry[]>(() =>
      rankEntries(sectorList.value, CASES),
  );

  const firstUid = computed(() => firstFinisherUid(sectorList.value));

  const visibleEntries = computed(() => entries.value.slice(0, RANKING_LIMIT));

  const mySource = computed(
      () =>
          rankable.value.find((source) => source.uid === user.value?.uid) ?? null,
  );

  const myEntry = computed(
      () => entries.value.find((entry) => entry.uid === user.value?.uid) ?? null,
  );

  const pinnedEntry = computed(() => {
    const mine = myEntry.value;
    if (!mine || mine.rank <= RANKING_LIMIT) return null;
    return mine;
  });

  const isStaff = computed(() => {
    const uid = user.value?.uid;
    return uid ? staffUids.value.has(uid) : false;
  });

  const needsSectorChoice = computed(
      () => !!user.value && !!mySource.value && mySource.value.sector === null,
  );

  const unassignedCount = computed(
      () => rankable.value.filter((source) => source.sector === null).length,
  );

  return {
    sectors: SECTORS,
    activeSector,
    entries,
    visibleEntries,
    pinnedEntry,
    myEntry,
    firstUid,
    isStaff,
    needsSectorChoice,
    unassignedCount,
  };
}

type RankingApi = ReturnType<typeof createRanking>;

let shared: RankingApi | null = null;

export function useRanking(): RankingApi {
  if (!shared) {
    shared = effectScope(true).run(createRanking)!;
  }
  return shared;
}