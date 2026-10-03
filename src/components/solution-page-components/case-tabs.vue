<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  tabs: { id: string; label: string }[];
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const buttons = ref<HTMLButtonElement[]>([]);

function setButtonRef(el: Element | null, index: number) {
  if (el instanceof HTMLButtonElement) buttons.value[index] = el;
}

// O painel é irmão das abas, então o id é derivado do id da aba e não precisa
// ser passado pelo pai: <CaseTabs> e os <section role="tabpanel"> compartilham
// a mesma convenção de id.
const tabId = (id: string) => `tab-${id}`;
const panelId = (id: string) => `panel-${id}`;

function select(id: string) {
  emit("update:modelValue", id);
}

function focusTab(index: number) {
  const tab = props.tabs[index];
  if (!tab) return;
  select(tab.id);
  buttons.value[index]?.focus();
}

function onKeydown(event: KeyboardEvent) {
  const lastIndex = props.tabs.length - 1;
  const current = props.tabs.findIndex((t) => t.id === props.modelValue);
  let next: number;

  switch (event.key) {
    case "ArrowRight":
      next = current < 0 ? 0 : Math.min(lastIndex, current + 1);
      break;
    case "ArrowLeft":
      next = current < 0 ? 0 : Math.max(0, current - 1);
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = lastIndex;
      break;
    default:
      return;
  }

  event.preventDefault();
  focusTab(next);
}
</script>

<template>
  <div class="case-tabs" role="tablist" @keydown="onKeydown">
    <button
      v-for="(tab, index) in tabs"
      :id="tabId(tab.id)"
      :key="tab.id"
      :ref="(el) => setButtonRef(el as Element | null, index)"
      role="tab"
      type="button"
      class="tab"
      :class="{ active: tab.id === modelValue }"
      :aria-selected="tab.id === modelValue"
      :aria-controls="panelId(tab.id)"
      :tabindex="tab.id === modelValue ? 0 : -1"
      @click="select(tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.case-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.8rem;
  border-bottom: 1px solid var(--rule);
}
.tab {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  letter-spacing: 0.03em;
  color: var(--ink-muted);
  background: none;
  border: none;
  padding: 0.8rem 0.3rem;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.tab + .tab {
  margin-left: 1.2rem;
}
.tab:hover {
  color: var(--ink);
}
.tab.active {
  color: var(--amber);
  border-bottom-color: var(--amber);
}
.tab:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}
</style>
