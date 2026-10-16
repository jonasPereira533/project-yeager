<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import type { SchemaTable } from "../../types/case";
import { useSqlCodeMirror } from "../../composables/use-sql-codemirror";
import { useEditorPrefs } from "../../composables/use-editor-prefs";

const props = defineProps<{
  modelValue: string;
  schema: SchemaTable[];
  running?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  run: [];
}>();

const editorContainer = ref<HTMLElement | null>(null);

const EDITOR_LABEL_ID = "sql-editor-label";

const AUTOCOMPLETE_HINT =
  "As sugestões trazem nome de tabela e coluna. Desligue para escrever a consulta do zero.";

const { autocomplete, setAutocomplete } = useEditorPrefs();

const { setValue } = useSqlCodeMirror({
  container: editorContainer,
  initialValue: props.modelValue,
  schema: toRef(props, "schema"),
  autocompleteOn: autocomplete,
  labelId: EDITOR_LABEL_ID,
  isRunning: () => props.running ?? false,
  onChange: (value) => emit("update:modelValue", value),
  onRun: () => emit("run"),
});

watch(
  () => props.modelValue,
  (value) => setValue(value),
);
</script>

<template>
  <div>
    <span :id="EDITOR_LABEL_ID" class="editor-label">Sua consulta</span>
    <div ref="editorContainer" class="editor-host" />
    <div class="editor-actions">
      <div class="editor-run">
        <button
          class="run-btn"
          type="button"
          :disabled="running"
          :aria-busy="running"
          @click="emit('run')"
        >
          {{ running ? "Consultando…" : "Investigar ▶" }}
        </button>
        <span class="run-hint"
          >Ctrl/Cmd + Enter também executa · Tab indenta</span
        >
      </div>
      <div class="editor-feedback">
        <slot name="feedback" />
      </div>
      <button
        class="toggle-btn"
        type="button"
        :aria-pressed="autocomplete"
        :title="AUTOCOMPLETE_HINT"
        @click="setAutocomplete(!autocomplete)"
      >
        Autocomplete: {{ autocomplete ? "ligado" : "desligado" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 0.5rem;
  display: block;
}
.editor-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.9rem;
  min-height: 6.5rem;
}
.editor-run {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.editor-feedback {
  margin-left: auto;
  margin-right: 8%;
  margin-top: 2%;
  max-width: 26rem;
}
.run-btn {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.85rem 1.6rem;
  border-radius: 0.125rem;
  cursor: pointer;
  border: 0.063rem solid transparent;
  color: #1a1305;
  background: var(--bg);
}

.run-btn {
  border-color: var(--rule);
  color: var(--ink-muted);
  font-family: "IBM Plex Mono", monospace;
}
.run-btn:hover {
  border-color: var(--ink-muted);
}
.run-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.run-btn:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

.run-hint {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
}

.toggle-btn {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  background: none;
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
  margin-left: auto;
}
.toggle-btn:hover {
  border-color: var(--amber);
  color: var(--ink);
}
.toggle-btn[aria-pressed="true"] {
  color: var(--amber);
  border-color: var(--amber);
}
.toggle-btn:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

@media (max-width: 53.75rem) {
  .editor-actions {
    flex-direction: column;
    min-height: 0;
  }
  .editor-feedback {
    margin: 0.5rem 0 0;
  }
}
</style>
