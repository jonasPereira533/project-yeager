<script setup lang="ts">
import type { QueryResult } from "../../types/case";

defineProps<{
  result: QueryResult | null;
  hasRun: boolean;
}>();

const CAPTION_ID = "results-caption";

function cellKey(columnIndex: number, column: string): string {
  return `${columnIndex}:${column}`;
}

function formatCell(value: unknown): string {
  if (value === null) return "NULL";
  if (value instanceof Uint8Array) {
    return `<blobby ${value.length} bytes>`;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
</script>

<template>
  <div class="results-block">
    <span :id="CAPTION_ID" class="eyebrow">Resultado da consulta</span>
    <p v-if="!hasRun" class="empty-note">Nenhuma consulta executada ainda.</p>
    <p v-else-if="!result || result.values.length === 0" class="empty-note">
      A consulta rodou, mas não retornou linhas.
    </p>
    <table v-else class="results-table" :aria-labelledby="CAPTION_ID">
      <thead>
        <tr>
          <th
            v-for="(col, colIndex) in result.columns"
            :key="cellKey(colIndex, col)"
            scope="col"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in result.values" :key="i">
          <td v-for="(cell, j) in row" :key="j">
            <span v-if="cell === null" class="null" title="Valor NULO no banco"
              >NULL</span
            >
            <template v-else>{{ formatCell(cell) }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.results-block {
  margin-top: 1.8rem;
}
.eyebrow {
  margin-bottom: 0.8rem;
  display: block;
}
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.results-table th {
  text-align: left;
  color: var(--amber);
  padding: 0.5rem 0.7rem;
  border-bottom: 0.063rem solid var(--rule);
  font-weight: 500;
}
.results-table td {
  padding: 0.45rem 0.7rem;
  border-bottom: 0.063rem dashed var(--rule);
  color: var(--ink);
}
.results-table td .null {
  font-style: italic;
  color: var(--ink-muted);
}
.empty-note {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--ink-muted);
}
</style>
