<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import type { Database } from "sql.js";
import CaseStrip from "../components/case-strip.vue";
import ObjectiveList from "../components/objective-list.vue";
import SchemaPanel from "../components/schema-panel.vue";
import DossierBriefing from "../components/dossier-briefing.vue";
import QuestionPanel from "../components/question-panel.vue";
import SqlEditor from "../components/sql-editor.vue";
import FeedbackStamp from "../components/feedback-stamp.vue";
import ResultsTable from "../components/results-table.vue";
import AppFooter from "../components/main-footer.vue";
import { CASES } from "../data/cases";
import { useSqlEngine } from "../composables/use-sql-engine";
import { useProgress } from "../composables/use-progress";
import {
  normalizeExecResult,
  rowSetsMatch,
  toQueryResult,
} from "../utils/compare-results";
import type { Feedback, QueryResult, SchemaTable } from "../types/case";
import MainHeader from "../components/shared-components/main-header.vue";
import { useRoute } from "vue-router";

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
  <p v-if="engineError" class="engine-error">{{ engineError }}</p>

  <template v-else>
    <MainHeader />

    <section class="desk">
      <aside>
        <ObjectiveList
          :active-case="activeCase"
          :active-objective-id="activeObjectiveId"
          @select="selectObjective"
        />
        <SchemaPanel :tables="schema" />
      </aside>

      <main>
        <DossierBriefing :active-case="activeCase" />
        <QuestionPanel :objective="activeObjective" />
        <SqlEditor v-model="queryText" :schema="schema" @run="runQuery" />
        <FeedbackStamp :feedback="feedback" />
        <ResultsTable :result="result" :has-run="hasRun" />
      </main>
    </section>
  </template>

  <AppFooter />
</template>

<style scoped>
.desk {
  display: grid;
  grid-template-columns: 18.75rem 1fr;
  gap: 3rem;
  padding: 3rem 5vw 5rem;
  align-items: start;
}
.engine-error {
  padding: 2rem 5vw;
  color: var(--stamp-red);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

@media (max-width: 53.75rem) {
  .desk {
    grid-template-columns: 1fr;
    padding: 2.2rem 6vw 3.5rem;
  }
}
</style>
