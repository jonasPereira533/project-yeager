<script setup lang="ts">
import { computed } from "vue";
import { BADGE_LABELS, type RankBadge } from "../../utils/ranking";

const props = defineProps<{
  badge: RankBadge;
}>();

const GLYPHS: Record<RankBadge, string> = {
  first: "⚑",
  gold: "1º",
  silver: "2º",
  bronze: "3º",
  noHints: "✔",
};

const label = computed(() => BADGE_LABELS[props.badge]);
</script>

<template>
  <span :class="['rank-badge', badge]">
    <span class="glyph" aria-hidden="true">{{ GLYPHS[badge] }}</span>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<style scoped>
.rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  border: 0.063rem dashed var(--rule);
  border-radius: 0.125rem;
  padding: 0.2rem 0.5rem;
  color: var(--ink-muted);
  white-space: nowrap;
}
.rank-badge .glyph {
  line-height: 1;
}
.rank-badge.gold,
.rank-badge.silver,
.rank-badge.bronze {
  border-style: solid;
  color: var(--amber);
}
.rank-badge.first {
  border-color: var(--amber);
  border-style: solid;
  color: var(--amber);
}
.rank-badge.noHints {
  border-color: var(--teal);
  color: var(--teal);
}

@media (max-width: 640px) {
  .rank-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }
}
</style>
