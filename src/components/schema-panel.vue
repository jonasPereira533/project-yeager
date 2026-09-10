<script setup lang="ts">
import type { SchemaTable } from "../types/case";

defineProps<{
  tables: SchemaTable[];
}>();
</script>

<template>
  <div class="side-block">
    <span class="eyebrow">Tabelas do banco</span>
    <div v-for="t in tables" :key="t.name" class="schema-card">
      <div class="head">{{ t.name }}</div>
      <div v-for="col in t.columns" :key="col.name" class="field">
        <span>{{ col.name }}</span>
        <span>{{ col.type }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.side-block {
  margin-bottom: 2.4rem;
}
.eyebrow {
  margin-bottom: 0.9rem;
  display: block;
}
.schema-card {
  background: var(--surface);
  border: 0.063rem solid var(--rule);
  border-radius: 0.25rem;
  margin-bottom: 0.7rem;
  overflow: hidden;
}
.head {
  background: var(--surface-2);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  padding: 0.5rem 0.75rem;
  color: var(--amber);
  border-bottom: 0.063rem solid var(--rule);
}
.field {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  padding: 0.3rem 0.75rem;
  color: var(--ink-muted);
}
.field span:last-child {
  color: #5b6472;
}
</style>
