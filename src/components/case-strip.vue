<script setup lang="ts">
import type { Case } from "../types/case";

defineProps<{
  cases: Case[];
  activeCaseId: string;
}>();

const emit = defineEmits<{
  select: [caseId: string];
}>();
</script>

<template>
  <nav class="case-strip">
    <div
      v-for="caseItem in cases"
      :key="caseItem.id"
      :class="['case-chip', { active: caseItem.id === activeCaseId }]"
      tabindex="0"
      @click="emit('select', caseItem.id)"
      @keydown.enter="emit('select', caseItem.id)"
    >
      <span class="num">Nº {{ caseItem.caseNumber }}</span
      >{{ caseItem.title }}
    </div>
  </nav>
</template>

<style scoped>
.case-strip {
  display: flex;
  gap: 0.7rem;
  padding: 1.1rem 5vw;
  border-bottom: 1px solid var(--rule);
  flex-wrap: wrap;
}
.case-chip {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink-muted);
  border: 1px solid var(--rule);
  background: var(--surface);
  padding: 0.5rem 1rem;
  border-radius: 2px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.case-chip:hover {
  border-color: var(--amber);
  color: var(--ink);
}
.case-chip.active {
  border-color: var(--amber);
  background: var(--surface-2);
  color: var(--ink);
}
.case-chip:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}
.num {
  color: var(--amber);
  margin-right: 0.5rem;
}
</style>
