<script setup lang="ts">
import { computed, ref } from "vue";
import { CASES } from "../../data/cases";
import { useProgress } from "../../composables/use-progress";
import { useDialogFocusTrap } from "../../composables/use-dialog-focus-trap";

const emit = defineEmits<{
  close: [];
}>();

const { isHintUsed, totalXP } = useProgress();

const casesCount = CASES.length;
const objectivesCount = CASES.reduce(
  (sum, caseItem) => sum + caseItem.objectives.length,
  0,
);

const hintsUsed = computed(() =>
  CASES.reduce(
    (sum, caseItem) =>
      sum +
      caseItem.objectives.filter((o) => isHintUsed(caseItem.id, o.id)).length,
    0,
  ),
);
const withoutHints = computed(() => hintsUsed.value === 0);

const message = computed(() =>
  withoutHints.value
    ? `Você fechou os ${objectivesCount} objetivos dos ${casesCount} chamados da fila sem abrir uma única dica. Você o verdadeiro guerreiro(a) das OS!`
    : `Você fechou os ${objectivesCount} objetivos dos ${casesCount} chamados da fila, mas abriu ${hintsUsed.value} ${hintsUsed.value === 1 ? "dica" : "dicas"}.`,
);

const dialog = ref<HTMLElement | null>(null);

const { onKeydown } = useDialogFocusTrap(dialog, () => emit("close"));
</script>

<template>
  <Teleport to="body">
    <div class="complete-overlay" @keydown="onKeydown">
      <div
        ref="dialog"
        class="complete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-complete-title"
        aria-describedby="archive-complete-text"
      >
        <p class="eyebrow">Fila de chamados· {{ casesCount }} chamados</p>

        <div class="marks">
          <span class="stamp">CHAMADOS FECHADOS</span>
          <span v-if="withoutHints" class="badge">SEM NENHUMA DICA</span>
        </div>

        <h2 id="archive-complete-title" class="title">
          Parabéns, você completou todos os chamados da fila!
        </h2>

        <p id="archive-complete-text" class="message">{{ message }}</p>

        <div class="summary">
          <span>Chamados {{ casesCount }}/{{ casesCount }}</span>
          <span>Objetivos {{ objectivesCount }}/{{ objectivesCount }}</span>
          <span>{{ totalXP }} XP acumulados</span>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-primary" @click="emit('close')">
            Fechar a fila
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.complete-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(10, 12, 15, 0.82);
}

.complete-dialog {
  width: 100%;
  max-width: 32rem;
  background: var(--surface);
  border: 0.063rem solid var(--rule);
  border-top: 0.188rem solid var(--amber);
  border-radius: 0.25rem;
  padding: 2rem;
  box-shadow: 0 1.5rem 3rem rgba(0, 0, 0, 0.45);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--amber);
  margin: 0 0 1rem;
}

.marks {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
  margin-bottom: 1.1rem;
}
.stamp {
  display: inline-block;
  font-family: var(--font-display);
  color: var(--teal);
  border: 0.188rem solid var(--teal);
  border-radius: 0.25rem;
  padding: 0.3rem 0.85rem;
  transform: rotate(-3deg);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  opacity: 0.9;
}
.badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--amber);
  border: 0.063rem dashed var(--amber);
  border-radius: 0.125rem;
  padding: 0.25rem 0.6rem;
}

.title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin: 0 0 0.7rem;
}

.message {
  font-size: 0.95rem;
  max-width: 48ch;
  margin: 0 0 1.4rem;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1.4rem;
  padding-top: 0.9rem;
  border-top: 0.063rem dashed var(--rule);
  margin-bottom: 1.6rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--ink-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.btn {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 0.125rem;
  cursor: pointer;
  border: 0.063rem solid transparent;
  padding: 0.65rem 1.1rem;
  text-decoration: none;
  display: inline-block;
}
.btn-primary {
  background: var(--amber);
  color: var(--bg);
}
.btn-primary:hover {
  filter: brightness(1.1);
}
.btn:focus-visible {
  outline: 0.125rem solid var(--amber);
  outline-offset: 0.125rem;
}
.btn-primary:focus-visible {
  outline-color: var(--ink);
}

@media (max-width: 30rem) {
  .complete-dialog {
    padding: 1.5rem;
  }
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
  .btn {
    text-align: center;
  }
}
</style>
