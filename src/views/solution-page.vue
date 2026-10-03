<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";
import type { Database } from "sql.js";
import ObjectiveList from "../components/solution-page-components/objective-list.vue";
import SchemaPanel from "../components/solution-page-components/schema-panel.vue";
import DossierBriefing from "../components/solution-page-components/dossier-briefing.vue";
import QuestionPanel from "../components/solution-page-components/question-panel.vue";
import SqlEditor from "../components/solution-page-components/sql-editor.vue";
import FeedbackStamp from "../components/solution-page-components/feedback-stamp.vue";
import ResultsTable from "../components/solution-page-components/results-table.vue";
import CaseTabs from "../components/solution-page-components/case-tabs.vue";
import { CASES } from "../data/cases";
import { useSqlEngine } from "../composables/use-sql-engine";
import { useProgress } from "../composables/use-progress";
import {
  normalizeExecResult,
  rowSetsMatch,
  toQueryResult,
} from "../utils/compare-results";
import type { Feedback, QueryResult, SchemaTable } from "../types/case";
import { useRoute } from "vue-router";
import CaseRules from "../components/solution-page-components/case-rules.vue";

const { createDatabase } = useSqlEngine();
const { markSolved } = useProgress();

const activeCaseId = ref(CASES[0].id);
const activeObjectiveId = ref<string | null>(null);
const db = shallowRef<Database | null>(null);
const schema = ref<SchemaTable[]>([]);
const queryText = ref("");
const result = ref<QueryResult | null>(null);
const hasRun = ref(false);
const feedback = ref<Feedback>({ type: "none", message: "" });
const engineError = ref("");

// Geração do contexto de execução. Incrementada a cada consulta e a cada troca
// de caso/objetivo: um resultado que resolve depois da tela ter mudado é
// descartado em vez de carimmar o objetivo que está visível.
let runSeq = 0;

const activeCase = computed(
  () => CASES.find((c) => c.id === activeCaseId.value)!,
);
const activeObjective = computed(
  () =>
    activeCase.value.objectives.find((o) => o.id === activeObjectiveId.value) ??
    null,
);

function readSchema(database: Database): SchemaTable[] {
  const tablesRes = database.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
  );
  if (!tablesRes.length) return [];
  return tablesRes[0].values.map((row) => {
    const tableName = String(row[0]);
    const info = database.exec(`PRAGMA table_info(${tableName});`);
    const columns = info.length
      ? info[0].values.map((col) => ({
          name: String(col[1]),
          type: String(col[2]),
        }))
      : [];
    return { name: tableName, columns };
  });
}

const route = useRoute();

const caseIdFromQuery = route.query.caseId as string | undefined;

if (caseIdFromQuery && CASES.some((c) => c.id === caseIdFromQuery)) {
  activeCaseId.value = caseIdFromQuery;
}

const TABS = [
  { id: "ficha", label: "Ficha do Caso" },
  { id: "investigacao", label: "Investigação" },
];
const activeTab = ref<"ficha" | "investigacao">("ficha");

async function loadCase(caseId: string) {
  const seq = ++runSeq;
  activeCaseId.value = caseId;
  const c = activeCase.value;

  let nextDb: Database | undefined;
  try {
    nextDb = await createDatabase(c.setupSQL);
    schema.value = readSchema(nextDb);
  } catch {
    nextDb?.close();
    if (seq === runSeq) {
      engineError.value =
        "Não foi possível carregar o motor SQLite (sql.js). Verifique a conexão de rede.";
    }
    return;
  }

  // O caso trocou enquanto o banco carregava: este não é mais o contexto atual.
  if (!nextDb || seq !== runSeq) {
    nextDb?.close();
    return;
  }

  db.value?.close();
  db.value = nextDb;
  queryText.value = "";
  result.value = null;
  hasRun.value = false;
  feedback.value = { type: "none", message: "" };
  activeObjectiveId.value = c.objectives[0]?.id ?? null;
}

function selectObjective(objectiveId: string) {
  runSeq++;
  activeObjectiveId.value = objectiveId;
  feedback.value = { type: "none", message: "" };
}

async function runQuery() {
  const database = db.value;
  const sql = queryText.value.trim();
  if (!database || !sql) return;

  // Captura o contexto antes de qualquer await: caso e objetivo precisam ser
  // lidos do mesmo instante, senão um markSolved pode gravar no caso errado.
  const seq = ++runSeq;
  const caseId = activeCaseId.value;
  const objective = activeObjective.value;

  hasRun.value = true;

  let execResult;
  try {
    execResult = database.exec(sql);
  } catch (err) {
    result.value = null;
    feedback.value = {
      type: "error",
      message:
        "Erro na consulta: " +
        (err instanceof Error ? err.message : String(err)),
    };
    return;
  }

  result.value = toQueryResult(execResult);

  if (!objective) {
    feedback.value = { type: "none", message: "" };
    return;
  }

  const refExecResult = (() => {
    try {
      return database.exec(objective.refSQL);
    } catch {
      return [];
    }
  })();

  const userRows = normalizeExecResult(execResult);
  const refRows = normalizeExecResult(refExecResult);

  if (!rowSetsMatch(userRows, refRows)) {
    feedback.value = { type: "open", message: "AINDA EM ABERTO" };
    return;
  }

  const outcome = await markSolved(caseId, objective.id);

  // O usuário trocou de caso/objetivo (ou disparou outra consulta) enquanto o
  // Firestore resolvia. O XP foi salvo no contexto correto, mas o carimbo
  // pertence à execução anterior — selectObjective/loadCase já limparam a tela.
  if (seq !== runSeq) return;

  if (outcome === "error") {
    feedback.value = {
      type: "error",
      message:
        "Consulta correta, mas não foi possível salvar seu progresso. Verifique sua conexão.",
    };
    return;
  }

  feedback.value = {
    type: "solved",
    message:
      outcome === "new"
        ? `CHAMADO ENCERRADO · +${objective.xp} XP`
        : "JÁ RESOLVIDO",
  };
}

onMounted(() => {
  loadCase(activeCaseId.value);
});

onUnmounted(() => {
  // A memória do banco vive no WASM e não é coletada pelo GC.
  db.value?.close();
  db.value = null;
});
</script>

<template>
  <div v-if="!activeCase" class="not-found">
    <p>Caso não encontrado.</p>
    <RouterLink :to="{ name: 'main-page' }">← Voltar pra lista de casos</RouterLink>
  </div>

  <div v-else class="solution-page">
    <div class="case-header">
      <div class="case-info">
        <span class="num">Nº {{ activeCase.caseNumber }}</span>
        <h1>{{ activeCase.title }}</h1>
        <span class="nivel">{{ activeCase.level }}</span>
      </div>
      <RouterLink :to="{ name: 'case-page' }"
        >← Voltar pra lista de casos</RouterLink
      >
    </div>

    <p v-if="engineError" class="engine-error">{{ engineError }}</p>
    <template v-else>
      <CaseTabs v-model="activeTab" :tabs="TABS" />

      <section
        v-show="activeTab === 'ficha'"
        id="panel-ficha"
        class="desk"
        role="tabpanel"
        aria-labelledby="tab-ficha"
        tabindex="0"
      >
        <DossierBriefing :active-case="activeCase" />
        <CaseRules />
      </section>

      <section
        v-show="activeTab === 'investigacao'"
        id="panel-investigacao"
        class="desk"
        role="tabpanel"
        aria-labelledby="tab-investigacao"
        tabindex="0"
      >
        <div class="investigacao-grid">
          <aside>
            <ObjectiveList
              :active-case="activeCase"
              :active-objective-id="activeObjectiveId"
              @select="selectObjective"
            />
            <SchemaPanel :tables="schema" />
          </aside>

          <div class="investigation-main">
            <QuestionPanel
              :objective="activeObjective"
              :case-id="activeCaseId"
            />
            <SqlEditor v-model="queryText" :schema="schema" @run="runQuery" />
            <FeedbackStamp :feedback="feedback" />
            <ResultsTable :result="result" :has-run="hasRun" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.solution-page {
  padding: 2.5rem 5vw 4rem;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.case-header .case-info {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  margin-bottom: 1.6rem;
  flex-wrap: wrap;
}
.case-header .num {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--amber);
  border: 1px solid var(--rule);
  padding: 0.25rem 0.6rem;
  border-radius: 2px;
}
.case-header h1 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  margin: 0;
}
.case-header .nivel {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--ink-muted);
}

.case-header a {
  color: var(--amber);
  display: inline-block;
  cursor: pointer;
}
.investigacao-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2.5rem;
  align-items: start;
}

.engine-error {
  padding: 2rem 5vw;
  color: var(--stamp-red);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.not-found {
  padding: 4rem 5vw;
  font-family: var(--font-mono);
}
.not-found a {
  color: var(--amber);
  display: inline-block;
  margin-top: 0.8rem;
}

@media (max-width: 53.75rem) {
  .desk {
    grid-template-columns: 1fr;
    padding: 2.2rem 6vw 3.5rem;
  }
}
</style>
