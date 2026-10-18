<script setup lang="ts">
import { ref, watch } from "vue";
import { SECTORS, type Sector } from "../../utils/ranking";
import { useDialogFocusTrap } from "../../composables/use-dialog-focus-trap";

const props = defineProps<{
  open: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [sector: Sector];
}>();

const picked = ref<Sector | null>(null);
const dialog = ref<HTMLElement | null>(null);

const { onKeydown } = useDialogFocusTrap(dialog, () => emit("close"));

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) picked.value = null;
  },
);

function confirm() {
  if (!picked.value || props.saving) return;
  emit("confirm", picked.value);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @keydown="onKeydown">
      <div
        ref="dialog"
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sector-picker-title"
        aria-describedby="sector-picker-text"
      >
        <p class="eyebrow">Classificação geral</p>

        <h2 id="sector-picker-title" class="title">Em qual setor você joga?</h2>

        <p id="sector-picker-text" class="text">
          O placar é dividido por setor, e cada setor tem os seus três
          primeiros. Escolha o seu.
        </p>

        <fieldset class="options">
          <legend class="sr-only">Escolha o seu setor</legend>
          <label
            v-for="sector in SECTORS"
            :key="sector"
            :class="['option', { picked: picked === sector }]"
          >
            <input
              v-model="picked"
              type="radio"
              name="sector"
              :value="sector"
              :disabled="saving"
            />
            <span>{{ sector }}</span>
          </label>
        </fieldset>

        <p class="warning">Isto não dá para mudar depois.</p>

        <div class="actions">
          <button type="button" class="btn btn-ghost" @click="emit('close')">
            Agora não
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!picked || saving"
            @click="confirm"
          >
            {{ saving ? "Salvando…" : "Confirmar setor" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(10, 12, 15, 0.82);
}

.dialog {
  width: 100%;
  max-width: 30rem;
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

.title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  margin: 0 0 0.7rem;
}

.text {
  font-size: 0.9rem;
  color: var(--ink-muted);
  margin: 0 0 1.3rem;
}

.options {
  border: 0;
  margin: 0 0 1rem;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 0.5rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border: 0.063rem solid var(--rule);
  border-radius: 0.125rem;
  padding: 0.55rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.option:hover {
  border-color: var(--ink-muted);
}
.option.picked {
  border-color: var(--amber);
  color: var(--amber);
}
.option input {
  accent-color: var(--amber);
  margin: 0;
}

.warning {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--stamp-red);
  margin: 0 0 1.5rem;
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
}
.btn-primary {
  background: var(--amber);
  color: var(--bg);
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
.btn-ghost {
  background: none;
  color: var(--ink-muted);
  border-color: var(--rule);
}
.btn:disabled {
  opacity: 0.55;
  cursor: progress;
}
.btn:focus-visible {
  outline: 0.125rem solid var(--amber);
  outline-offset: 0.125rem;
}

@media (max-width: 30rem) {
  .dialog {
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
