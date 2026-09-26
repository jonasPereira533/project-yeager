<script lang="ts" setup>
import type { Case } from "../../types/case";

defineProps<{
  activeCase: Case;
}>();
</script>

<template>
  <div class="dossier" :data-num="`Nº ${activeCase.caseNumber}`">
    <div class="dossier-title">Relato do chamado</div>
    <div class="dossier-row">
      <span>Categoria</span><span>{{ activeCase.category }}</span>
    </div>
    <div class="dossier-row">
      <span>Nível</span><span>{{ activeCase.level }}</span>
    </div>
    <div class="dossier-row">
      <span>Tabelas envolvidas</span><span>{{ activeCase.tables }}</span>
    </div>
    <p class="dossier-context">{{ activeCase.context }}</p>
  </div>
</template>

<style scoped>
.dossier {
  position: relative;
  background: var(--surface);
  border: 0.063rem solid var(--rule);
  border-radius: 0.25rem;
  padding: 2rem 2rem 1.6rem;
  margin-bottom: 2.2rem;
}
.dossier::before {
  content: attr(data-num);
  position: absolute;
  top: -0.9rem;
  left: 1.6rem;
  background: var(--surface-2);
  border: 0.063rem solid var(--rule);
  padding: 0.25rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  border-radius: 0.125rem;
}
.dossier-title {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  text-transform: uppercase;
  margin-bottom: 1.1rem;
}
.dossier-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 0.063rem dashed var(--rule);
  font-family: var(--font-mono);
  font-size: 0.88rem;
}
.dossier-context {
  padding-top: 1.1rem;
  color: var(--ink-muted);
  font-size: 0.95rem;
  max-width: 68ch;
}
</style>
