import { effectScope, ref } from "vue";

const STORAGE_KEY = "yeager:archive-celebrated";

function readCelebrated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function createArchiveCelebration() {
  const celebrated = ref(readCelebrated());

  function celebrate() {
    celebrated.value = true;
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // cota cheia ou storage bloqueado: o parabéns pode reaparecer
    }
  }

  return { celebrated, celebrate };
}

export type ArchiveCelebrationApi = ReturnType<typeof createArchiveCelebration>;

let shared: ArchiveCelebrationApi | null = null;

/**
 * O encerramento do arquivo inteiro se comemora uma unica vez por
 * dispositivo, para ninguem ser aplaudido toda vez que volta pra lista.
 */
export function useArchiveCelebration(): ArchiveCelebrationApi {
  if (!shared) {
    shared = effectScope(true).run(createArchiveCelebration)!;
  }
  return shared;
}
