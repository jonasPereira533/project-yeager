<script setup lang="ts">
import type { Feedback } from "../../types/case";

defineProps<{
  feedback: Feedback;
}>();
</script>

<template>
  <div v-if="feedback.type === 'error'" class="feedback-error">
    {{ feedback.message }}
  </div>
  <div v-else-if="feedback.type === 'solved'" class="feedback-stamp solved">
    {{ feedback.message }}
  </div>
  <div v-else-if="feedback.type === 'open'" class="feedback-stamp open">
    {{ feedback.message }}
  </div>
</template>

<style scoped>
.feedback-stamp {
  display: inline-block;
  font-family: var(--font-display);
  border: 0.188rem solid;
  padding: 0.35rem 0.9rem;
  border-radius: 0.25rem;
  transform: rotate(-6deg);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  margin-top: 1.2rem;
  opacity: 0.9;
}
.feedback-stamp.open {
  color: var(--stamp-red);
  border-color: var(--stamp-red);
}
.feedback-stamp.solved {
  color: var(--teal);
  border-color: var(--teal);
  transform: rotate(-3deg);
}
.feedback-error {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: #f2b3ac;
  border: 0.063rem solid var(--stamp-red);
  background: rgba(193, 68, 60, 0.1);
  border-radius: 0.25rem;
  padding: 0.75rem 0.95rem;
  margin-top: 1.2rem;
  white-space: pre-wrap;
}
</style>
