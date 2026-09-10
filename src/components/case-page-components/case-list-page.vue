<script setup lang="ts">
import { computed } from "vue";
import { CASES } from "../../data/cases";
import type { Case } from "../../types/case";

const emit = defineEmits<{
  "select-case": [caseId: string];
}>();

const LEVEL_ORDER = ["Iniciante", "Intermediário", "Avançado"] as const;

const LEVEL_META: Record<
    (typeof LEVEL_ORDER)[number],
    { colorClass: string; description: string }
> = {
  Iniciante: {
    colorClass: "low",
    description: "Consultas simples, uma tabela por vez.",
  },
  Intermediário: {
    colorClass: "mid",
    description: "Junções entre tabelas e filtros.",
  },
  Avançado: {
    colorClass: "high",
    description: "Múltiplas junções, subconsultas e pistas escondidas.",
  },
};

interface CaseGroup {
  level: string;
  colorClass: string;
  description: string;
  cases: Case[];
}

const groupedCases = computed<CaseGroup[]>(() =>
    LEVEL_ORDER.map((level) => ({
      level,
      colorClass: LEVEL_META[level].colorClass,
      description: LEVEL_META[level].description,
      cases: CASES.filter((c) => c.level === level),
    })).filter((group) => group.cases.length > 0),
);

function totalXp(caseItem: Case): number {
  return caseItem.objectives.reduce((sum, o) => sum + o.xp, 0);
}

function selectCase(caseId: string) {
  emit("select-case", caseId);
}
</script>

<template>
  <section class="case-catalog">
    <div class="page-head">
      <div class="eyebrow">Arquivo de Casos</div>
      <h1>Escolha sua investigação</h1>
    </div>

    <div v-for="group in groupedCases" :key="group.level" class="level-group">
      <div class="level-head">
        <h2 :class="['level-title', group.colorClass]">{{ group.level }}</h2>
        <span class="level-desc">{{ group.description }}</span>
        <span class="level-count">{{ group.cases.length }} casos</span>
      </div>

      <div class="case-grid">
        <div
            v-for="caseItem in group.cases"
            :key="caseItem.id"
            :class="['case-card', group.colorClass]"
            tabindex="0"
            @click="selectCase(caseItem.id)"
            @keydown.enter="selectCase(caseItem.id)"
        >
          <div class="case-card-top">
            <span class="case-number">Nº {{ caseItem.caseNumber }}</span>
            <span class="case-xp">{{ totalXp(caseItem) }} XP</span>
          </div>
          <h3 class="case-title">{{ caseItem.title }}</h3>
          <p class="case-category">{{ caseItem.category }}</p>
          <p class="case-context">{{ caseItem.context }}</p>
          <div class="case-card-footer">
            <span class="case-tables">Tabelas: {{ caseItem.tables }}</span>
            <span class="case-objectives"
            >{{ caseItem.objectives.length }} objetivos</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.case-catalog {
  padding: 3rem 5vw 5rem;
}

.page-head {
  max-width: 60ch;
  margin-bottom: 3rem;
}
.eyebrow {
  font-family: "Special Elite", monospace;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--amber);
}
.page-head h1 {
  font-family: "Special Elite", monospace;
  font-size: 2rem;
  margin: 0.6rem 0 0.8rem;
}
.subtitle {
  font-size: 0.95rem;
  color: var(--ink-muted);
  margin: 0;
}

.level-group {
  margin-bottom: 3rem;
}
.level-head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 0.8rem;
  margin-bottom: 1.5rem;
}
.level-title {
  font-family: "IBM Plex Mono", monospace;
  font-size: 1.1rem;
  letter-spacing: 0.04em;
  margin: 0;
  padding-left: 0.8rem;
  border-left: 4px solid var(--teal);
}
.level-title.mid {
  border-left-color: var(--amber);
}
.level-title.high {
  border-left-color: var(--stamp-red);
}
.level-desc {
  font-size: 0.85rem;
  color: var(--ink-muted);
}
.level-count {
  margin-left: auto;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.8rem;
  color: var(--ink-muted);
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.case-card {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-left: 4px solid var(--teal);
  border-radius: 4px;
  padding: 1.2rem 1.3rem;
  cursor: pointer;
  transition:
      border-color 0.2s,
      background 0.2s,
      transform 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.case-card.mid {
  border-left-color: var(--amber);
}
.case-card.high {
  border-left-color: var(--stamp-red);
}
.case-card:hover,
.case-card:focus-visible {
  background: var(--surface-2);
  transform: translateY(-2px);
}
.case-card:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

.case-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.case-number {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.8rem;
  color: var(--amber);
}
.case-xp {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.75rem;
  color: var(--ink-muted);
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
}

.case-title {
  font-size: 1.05rem;
  margin: 0.2rem 0 0;
}
.case-category {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  color: var(--ink-muted);
  margin: 0;
}
.case-context {
  font-size: 0.85rem;
  color: var(--ink-muted);
  margin: 0.3rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-card-footer {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.75rem;
  color: var(--ink-muted);
}

@media (max-width: 640px) {
  .case-grid {
    grid-template-columns: 1fr;
  }
  .level-count {
    margin-left: 0;
  }
}
</style>