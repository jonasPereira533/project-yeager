import { computed, effectScope, reactive, watch } from "vue";
import { doc, setDoc } from "firebase/firestore";
import { useCurrentUser, useDocument, useFirestore } from "vuefire";

/**
 * Rascunhos das consultas, por caso e por objetivo.
 *
 * Sem login o rascunho vai para o localStorage, porque um rascunho que some
 * no refresh e exatamente o problema que estamos resolvendo. Com login ele vai
 * para o Firestore, no mesmo documento de progresso.
 *
 * O `cache` local e a fonte da leitura: ele e semeado pelo localStorage e
 * complementado pelo servidor, e toda escrita passa por ele antes de ir pro
 * Firestore. Assim a troca de objetivo le sempre o que acabou de ser digitado,
 * sem esperar a rede.
 */

const STORAGE_KEY = "yeager:drafts";
const SAVE_DEBOUNCE_MS = 800;

interface CaseDraft {
  activeObjectiveId?: string;
  queries?: Record<string, string>;
}

type DraftMap = Record<string, CaseDraft>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * O servidor e a entrada nao confiavel: qualquer um pode escrever um rascunho
 * com formato inesperado, e isso nao pode quebrar o editor.
 */
function sanitize(raw: unknown): DraftMap {
  if (!isPlainObject(raw)) return {};

  const out: DraftMap = {};
  for (const [caseId, value] of Object.entries(raw)) {
    if (!isPlainObject(value)) continue;

    const draft: CaseDraft = {};

    if (
      typeof value.activeObjectiveId === "string" &&
      value.activeObjectiveId
    ) {
      draft.activeObjectiveId = value.activeObjectiveId;
    }

    if (isPlainObject(value.queries)) {
      const queries: Record<string, string> = {};
      for (const [objectiveId, sql] of Object.entries(value.queries)) {
        if (typeof sql === "string") queries[objectiveId] = sql;
      }
      draft.queries = queries;
    }

    if (Object.keys(draft).length) out[caseId] = draft;
  }
  return out;
}

function readLocal(): DraftMap {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return {};
  }
}

function isEmptyDraft(draft: CaseDraft | undefined): boolean {
  if (!draft) return true;
  const queries = draft.queries ?? {};
  return (
    !draft.activeObjectiveId &&
    Object.values(queries).every((sql) => !sql)
  );
}

function createDrafts() {
  const db = useFirestore();
  const user = useCurrentUser();

  const userDocRef = computed(() =>
    user.value ? doc(db, "users", user.value.uid) : null,
  );

  const { data: userDoc } = useDocument(userDocRef);

  const cache = reactive<DraftMap>(readLocal());

  function persistLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // cota cheia ou storage bloqueado: o rascunho continua em memoria
    }
  }

  // Complementa o cache com o que veio do servidor, sem sobrescrever rascunho
  // local que ainda nao foi enviado.
  watch(
    () => userDoc.value?.draftsByCase,
    (remote) => {
      if (!remote) return;
      const clean = sanitize(remote);

      for (const [caseId, draft] of Object.entries(clean)) {
        if (isEmptyDraft(draft)) continue;
        const local = cache[caseId];
        if (!local) {
          cache[caseId] = draft;
          continue;
        }
        if (!local.activeObjectiveId && draft.activeObjectiveId) {
          local.activeObjectiveId = draft.activeObjectiveId;
        }
        const localQueries = (local.queries ??= {});
        for (const [objectiveId, sql] of Object.entries(draft.queries ?? {})) {
          if (!localQueries[objectiveId]) localQueries[objectiveId] = sql;
        }
      }
      persistLocal();
    },
    { immediate: true },
  );

  // Migration: leva o rascunho do visitante para a conta, sem sobrescrever o
  // que ja estiver no servidor.
  watch(user, async (newUser, oldUser) => {
    if (oldUser || !newUser) return;
    if (!Object.keys(cache).length) return;

    const server = sanitize(userDoc.value?.draftsByCase);
    const toWrite: DraftMap = {};

    for (const [caseId, draft] of Object.entries(cache)) {
      if (isEmptyDraft(draft)) continue;
      if (!isEmptyDraft(server[caseId])) continue;
      toWrite[caseId] = draft;
    }

    if (!Object.keys(toWrite).length) return;

    try {
      await setDoc(
        doc(db, "users", newUser.uid),
        { draftsByCase: toWrite },
        { merge: true },
      );
    } catch (error) {
      console.error("Falha ao migrar rascunhos de visitante:", error);
    }
  });

  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function caseDraft(caseId: string): CaseDraft {
    return (cache[caseId] ??= {});
  }

  function getDraft(caseId: string, objectiveId: string): string {
    return cache[caseId]?.queries?.[objectiveId] ?? "";
  }

  function getActiveObjective(caseId: string): string | null {
    return cache[caseId]?.activeObjectiveId ?? null;
  }

  function schedule(caseId: string, tag: string) {
    const key = `${caseId}:${tag}`;
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        void push(caseId);
      }, SAVE_DEBOUNCE_MS),
    );
  }

  function saveDraft(caseId: string, objectiveId: string, sql: string) {
    const queries = (caseDraft(caseId).queries ??= {});
    if (queries[objectiveId] === sql) return;
    queries[objectiveId] = sql;
    persistLocal();
    schedule(caseId, `q:${objectiveId}`);
  }

  function setActiveObjective(caseId: string, objectiveId: string) {
    const draft = caseDraft(caseId);
    if (draft.activeObjectiveId === objectiveId) return;
    draft.activeObjectiveId = objectiveId;
    persistLocal();
    schedule(caseId, "active");
  }

  /**
   * Envia o rascunho inteiro do caso. O merge do Firestore e recursivo, entao
   * os objetivos que nao entraram nesta escrita continuam no servidor.
   */
  async function push(caseId: string) {
    if (!user.value) return;
    const draft = cache[caseId];
    if (!draft || isEmptyDraft(draft)) return;

    try {
      await setDoc(
        doc(db, "users", user.value.uid),
        { draftsByCase: { [caseId]: draft } },
        { merge: true },
      );
    } catch (error) {
      console.error("Falha ao salvar rascunho da consulta:", error);
    }
  }

  /** Na troca de objetivo e no unmount, para nao perder a ultima tecla. */
  function saveNow(caseId: string) {
    for (const [key, timer] of timers) {
      if (!key.startsWith(`${caseId}:`)) continue;
      clearTimeout(timer);
      timers.delete(key);
    }
    void push(caseId);
  }

  function cancelPending() {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  }

  return {
    getDraft,
    getActiveObjective,
    saveDraft,
    saveNow,
    setActiveObjective,
    cancelPending,
  };
}

type Drafts = ReturnType<typeof createDrafts>;

let shared: Drafts | null = null;

export function useDrafts(): Drafts {
  if (!shared) {
    shared = effectScope(true).run(createDrafts)!;
  }
  return shared;
}