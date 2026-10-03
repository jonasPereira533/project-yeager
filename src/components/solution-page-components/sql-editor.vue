<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import type { SchemaTable } from "../../types/case";
import { useSqlCodeMirror } from "../../composables/use-sql-codemirror";

const props = defineProps<{
  modelValue: string;
  schema: SchemaTable[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  run: [];
}>();

const editorContainer = ref<HTMLElement | null>(null);

// O CodeMirror não é um elemento labelável, então o <label> visível aponta para
// o id e o editor o consome via aria-labelledby.
const EDITOR_LABEL_ID = "sql-editor-label";

const { setValue } = useSqlCodeMirror({
  container: editorContainer,
  initialValue: props.modelValue,
  schema: toRef(props, "schema"),
  labelId: EDITOR_LABEL_ID,
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
      <button class="run-btn" type="button" @click="emit('run')">
        Investigar ▶
      </button>
      <span class="run-hint"
        >Ctrl/Cmd + Enter também executa · Tab indenta</span
      >
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
  align-items: center;
  gap: 1rem;
  margin-top: 0.9rem;
  flex-wrap: wrap;
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

.run-hint {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
}
</style>
