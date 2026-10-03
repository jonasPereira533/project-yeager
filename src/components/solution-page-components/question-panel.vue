<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Objective } from "../../types/case";
import { useProgress } from "../../composables/use-progress";

const props = defineProps<{
  objective: Objective | null;
  caseId: string;
}>();

const { isHintUsed, useHint } = useProgress();

const showHint = ref(false);
const hintNotice = ref("");

watch(
    () => props.objective?.id,
    () => {
      showHint.value = false;
      hintNotice.value = "";
    },
);

const hintAlreadyUsed = computed(() =>
    props.objective ? isHintUsed(props.caseId, props.objective.id) : false,
);

async function toggleHint() {
  const objective = props.objective;
  if (!objective) return;

  const objectiveId = objective.id;
  const caseId = props.caseId;
  const willShow = !showHint.value;
  hintNotice.value = "";

  if (willShow && !isHintUsed(caseId, objectiveId)) {
    const outcome = await useHint(caseId, objectiveId);

    // Se o objetivo mudou enquanto o Firestore resolvia, a dica visível agora é
    // de outro objetivo e a cobrança foi para o anterior: não abre de graça.
    if (props.objective?.id !== objectiveId) return;

    if (outcome === "error") {
      hintNotice.value =
        "Não foi possível registrar o custo da dica. Ela foi liberada, mas o -5 XP pode não ter sido salvo.";
    }
  }

  showHint.value = willShow;
}
</script>

<template>
  <div v-if="objective" class="question-block">
    <div class="question-head">
      <p>{{ objective.question }}</p>
      <button
          class="btn btn-ghost btn-sm"
          type="button"
          @click="toggleHint"
      >
        {{
          showHint
              ? "Esconder dica"
              : hintAlreadyUsed
                  ? "Mostrar dica"
                  : "Mostrar dica (-5 XP)"
        }}
      </button>
    </div>
    <p v-if="showHint" class="hint-text">{{ objective.hint }}</p>
    <p v-if="hintNotice" class="hint-notice">{{ hintNotice }}</p>
  </div>
</template>

<style scoped>
.question-block {
  margin-bottom: 1.6rem;
}
.question-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.2rem;
  margin-bottom: 0.5rem;
}
.question-head p {
  font-size: 1rem;
  max-width: 60ch;
  margin: 0;
}
.hint-text {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-top: 0.6rem;
  border-left: 0.125rem solid var(--rule);
  padding-left: 0.7rem;
}
.hint-notice {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--stamp-red);
  margin-top: 0.5rem;
  border-left: 0.125rem solid var(--stamp-red);
  padding-left: 0.7rem;
}
.btn {
  font-family: var(--font-sans);
  font-weight: 600;
  border-radius: 0.125rem;
  cursor: pointer;
  border: 0.063rem solid transparent;
}
.btn-ghost {
  border-color: var(--rule);
  color: var(--ink);
  background: none;
}
.btn-ghost:hover {
  border-color: var(--ink-muted);
}
.btn-sm {
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  font-weight: 500;
}
.btn:focus-visible {
  outline: 0.125rem solid var(--amber);
  outline-offset: 0.125rem;
}
</style>