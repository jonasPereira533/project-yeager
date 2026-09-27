<script setup lang="ts">
import type { Case } from "../../types/case";
import { useProgress } from "../../composables/use-progress";

const props = defineProps<{
  activeCase: Case;
  activeObjectiveId: string | null;
}>();

const emit = defineEmits<{
  select: [objectiveId: string];
}>();

const { isSolved } = useProgress();
</script>

<template>
  <div class="side-block">
    <span class="eyebrow">Objetivos do chamado</span>

    <div
      v-for="(o, i) in props.activeCase.objectives"
      :key="o.id"
      class="objective-row"
      :class="{
        active: o.id === activeObjectiveId,
        solved: isSolved(props.activeCase.id, o.id),
      }"
      tabindex="0"
      @click="emit('select', o.id)"
      @keydown.enter="emit('select', o.id)"
    >
      <span class="label">
        <span v-if="isSolved(props.activeCase.id, o.id)" class="check">✔</span>
        Objetivo {{ i + 1 }}
      </span>
      <span class="xp">{{ o.xp }} XP</span>
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
.objective-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.8rem;
  border: 0.063rem solid var(--rule);
  border-radius: 0.125rem;
  margin-bottom: 0.55rem;
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.2s;
}
.objective-row:hover {
  border-color: var(--amber);
}
.objective-row.active {
  border-color: var(--amber);
  background: var(--surface-2);
}
.objective-row.solved {
  opacity: 0.65;
}
.objective-row:focus-visible {
  outline: 0.125rem solid var(--amber);
  outline-offset: 0.125rem;
}
.label {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.check {
  color: var(--teal);
  margin-right: 0.35rem;
}
.xp {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-muted);
  white-space: nowrap;
}
</style>
