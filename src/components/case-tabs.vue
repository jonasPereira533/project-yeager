<script setup lang="ts">
defineProps<{
  tabs: { id: string; label: string }[];
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="case-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      type="button"
      class="tab"
      :class="{ active: tab.id === modelValue }"
      :aria-selected="tab.id === modelValue"
      @click="emit('update:modelValue', tab.id)"
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
