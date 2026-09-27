<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import type { Database } from "sql.js";
import ObjectiveList from "../components/objective-list.vue";
import SchemaPanel from "../components/schema-panel.vue";
import DossierBriefing from "../components/dossier-briefing.vue";
import QuestionPanel from "../components/question-panel.vue";
import SqlEditor from "../components/sql-editor.vue";
import FeedbackStamp from "../components/feedback-stamp.vue";
import ResultsTable from "../components/results-table.vue";
import CaseTabs from "../components/case-tabs.vue";
import { CASES } from "../data/cases";
import { useSqlEngine } from "../composables/use-sql-engine";
import { useProgress } from "../composables/use-progress";
import {
  normalizeExecResult,
  rowSetsMatch,
  toQueryResult,
} from "../utils/compare-results";
import type { Feedback, QueryResult, SchemaTable } from "../types/case";
import { useRoute, useRouter } from "vue-router";
import CaseRules from "../components/case-rules.vue";

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

const router = useRouter();

const goToMainPage = () => {
  router.push({ name: "main-page" });
};

const goToCasePage = () => {
  router.push({ name: "case-page" });
};

const TABS = [
  { id: "ficha", label: "Ficha do Caso" },
  { id: "investigacao", label: "Investigação" },
];
const activeTab = ref<"ficha" | "investigacao">("ficha");

async function loadCase(caseId: string) {
  activeCaseId.value = caseId;
  const c = activeCase.value;

  try {
    db.value = await createDatabase(c.setupSQL);
    schema.value = readSchema(db.value);
  } catch {
    engineError.value =
      "Não foi possível carregar o motor SQLite (sql.js). Verifique a conexão de rede.";
    return;
  }

  queryText.value = "";
  result.value = null;
  hasRun.value = false;
  feedback.value = { type: "none", message: "" };
  activeObjectiveId.value = c.objectives[0]?.id ?? null;
}

function selectObjective(objectiveId: string) {
  activeObjectiveId.value = objectiveId;
  feedback.value = { type: "none", message: "" };
}

function runQuery() {
  const database = db.value;
  const sql = queryText.value.trim();
  if (!database || !sql) return;

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

  const objective = activeObjective.value;
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
  const matches = rowSetsMatch(userRows, refRows);

  if (matches) {
    const wasNew = markSolved(activeCaseId.value, objective.id);
    feedback.value = {
      type: "solved",
      message: wasNew
        ? `CHAMADO ENCERRADO · +${objective.xp} XP`
        : "JÁ RESOLVIDO",
    };
  } else {
    feedback.value = { type: "open", message: "AINDA EM ABERTO" };
  }
}

onMounted(() => {
  loadCase(activeCaseId.value);
});
</script>

<template>
  <div v-if="!activeCase" class="not-found">
    <p>Caso não encontrado.</p>
    <a @click="goToMainPage">← Voltar pra lista de casos</a>
  </div>

  <div v-else class="solution-page">
    <div class="case-header">
      <div class="case-info">
        <span class="num">Nº {{ activeCase.caseNumber }}</span>
        <h1>{{ activeCase.title }}</h1>
        <span class="nivel">{{ activeCase.level }}</span>
      </div>
      <a @click="goToCasePage">← Voltar pra lista de casos</a>
    </div>

    <p v-if="engineError" class="engine-error">{{ engineError }}</p>
    <template v-else>
      <CaseTabs v-model="activeTab" :tabs="TABS" />

      <section v-show="activeTab === 'ficha'" class="desk">
        <DossierBriefing :active-case="activeCase" />
        <CaseRules />
      </section>

      <section v-show="activeTab === 'investigacao'" class="desk">
        <div class="investigacao-grid">
          <aside>
            <ObjectiveList
              :active-case="activeCase"
              :active-objective-id="activeObjectiveId"
              @select="selectObjective"
            />
            <SchemaPanel :tables="schema" />
          </aside>

          <main>
            <QuestionPanel :objective="activeObjective" />
            <SqlEditor v-model="queryText" :schema="schema" @run="runQuery" />
            <FeedbackStamp :feedback="feedback" />
            <ResultsTable :result="result" :has-run="hasRun" />
          </main>
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
