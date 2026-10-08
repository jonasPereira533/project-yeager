<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Case } from "../../types/case";
import { CASES } from "../../data/cases";
import { useProgress } from "../../composables/use-progress";

const props = defineProps<{
  activeCase: Case;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { isHintUsed } = useProgress();

const objectivesCount = computed(() => props.activeCase.objectives.length);
const caseXp = computed(() =>
  props.activeCase.objectives.reduce((sum, o) => sum + o.xp, 0),
);

const hintsUsed = computed(
  () =>
    props.activeCase.objectives.filter((o) =>
      isHintUsed(props.activeCase.id, o.id),
    ).length,
);
const withoutHints = computed(() => hintsUsed.value === 0);

const message = computed(() =>
  withoutHints.value
    ? `Você fechou os ${objectivesCount.value} objetivos do chamado sem abrir uma única dica. Os ${caseXp.value} XP do caso são integralmente seus.`
    : `Você fechou os ${objectivesCount.value} objetivos do chamado, mas abriu ${hintsUsed.value} ${hintsUsed.value === 1 ? "dica" : "dicas"}. O desconto delas já foi abatido do seu XP.`,
);

const nextRoute = computed(() => {
  const index = CASES.findIndex((c) => c.id === props.activeCase.id);
  const next = index >= 0 ? CASES[index + 1] : undefined;
  return next
    ? { name: "solution-page", query: { caseId: next.id } }
    : undefined;
});

const dialog = ref<HTMLElement | null>(null);

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function focusables(): HTMLElement[] {
  return dialog.value
    ? Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    : [];
}

let previousOverflow = "";
let returnFocusTo: HTMLElement | null = null;

onMounted(() => {
  returnFocusTo =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  focusables()[0]?.focus();
});

onUnmounted(() => {
  document.body.style.overflow = previousOverflow;
  if (returnFocusTo?.isConnected) returnFocusTo.focus();
});

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
    return;
  }

  if (event.key !== "Tab") return;

  const items = focusables();
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];
  const current = document.activeElement;
  if (!first || !last) return;

  if (
    event.shiftKey &&
    (current === first || !dialog.value?.contains(current))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (current === last || !dialog.value?.contains(current))
  ) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="complete-overlay" @keydown="onKeydown">
      <div
        ref="dialog"
        class="complete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-modal-title"
        aria-describedby="complete-modal-text"
      >
        <p class="eyebrow">
          Caso Nº {{ activeCase.caseNumber }} · {{ activeCase.title }}
        </p>

        <div class="marks">
          <span class="stamp">CHAMADO ENCERRADO</span>
          <span v-if="withoutHints" class="badge">SEM DICAS · XP INTEIRO</span>
        </div>

        <h2 id="complete-modal-title" class="title">Investigação concluída</h2>

        <p id="complete-modal-text" class="message">{{ message }}</p>

        <div class="summary">
          <span>Objetivos {{ objectivesCount }}/{{ objectivesCount }}</span>
          <span>{{ caseXp }} XP no caso</span>
        </div>

        <div class="actions">
          <RouterLink v-if="nextRoute" class="btn btn-primary" :to="nextRoute">
            Próximo caso →
          </RouterLink>
          <span v-else class="btn btn-primary is-off" aria-disabled="true"
            >Último caso do arquivo</span
          >
          <RouterLink class="btn btn-ghost" :to="{ name: 'case-page' }">
            Voltar pra lista de casos
          </RouterLink>
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
  background: rgba(10, 12, 15, 0.78);
}

.complete-dialog {
  width: 100%;
  max-width: 32rem;
  background: var(--surface);
  border: 0.063rem solid var(--rule);
  border-top: 0.188rem solid var(--teal);
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
.btn-primary.is-off {
  background: var(--surface-2);
  color: var(--ink-muted);
  border-color: var(--rule);
  cursor: not-allowed;
  opacity: 0.7;
}
.btn-ghost {
  border-color: var(--rule);
  color: var(--ink);
  background: none;
}
.btn-ghost:hover {
  border-color: var(--ink-muted);
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
