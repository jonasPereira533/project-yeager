<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useCurrentUser } from "vuefire";
import { CASES } from "../../data/cases";
import { useAuth } from "../../composables/use-auth";
import { useRanking } from "../../composables/use-ranking";
import {
  badgesFor,
  type RankBadge as RankBadgeKind,
  type RankEntry,
  type Sector,
} from "../../utils/ranking";
import { useLeaderboardEntry } from "../../composables/use-leaderboard-entry";
import RankBadge from "./rank-badge.vue";
import SectorPickerModal from "./sector-picker-modal.vue";

const CAPTION_ID = "ranking-caption";

const user = useCurrentUser();
const { loginWithGoogle, pending } = useAuth();
const { chooseSector, publishError } = useLeaderboardEntry();
const {
  sectors,
  activeSector,
  visibleEntries,
  pinnedEntry,
  myEntry,
  firstUid,
  entries,
  isStaff,
  needsSectorChoice,
  unassignedCount,
} = useRanking();

const showSectorModal = ref(needsSectorChoice.value);
const savingSector = ref(false);

watch(needsSectorChoice, (needs) => {
  if (needs) showSectorModal.value = true;
});

async function confirmSector(sector: Sector) {
  savingSector.value = true;
  const saved = await chooseSector(sector);
  savingSector.value = false;
  if (saved) {
    showSectorModal.value = false;
    activeSector.value = sector;
  }
}

const objectivesCount = CASES.reduce(
  (sum, caseItem) => sum + caseItem.objectives.length,
  0,
);

function formatXp(xp: number): string {
  return xp.toLocaleString("pt-BR");
}

type RankLine =
  | { kind: "separator"; key: string }
  | {
      kind: "entry";
      key: string;
      entry: RankEntry;
      badges: RankBadgeKind[];
      isMe: boolean;
    };

function toEntryItem(entry: RankEntry): RankLine {
  return {
    kind: "entry",
    key: entry.uid,
    entry,
    badges: badgesFor(entry, firstUid.value),
    isMe: entry.uid === user.value?.uid,
  };
}

const tableItems = computed<RankLine[]>(() => {
  const items: RankLine[] = visibleEntries.value.map(toEntryItem);
  const pinned = pinnedEntry.value;
  if (pinned) {
    items.push({ kind: "separator", key: "ranking-sua-posicao" });
    items.push(toEntryItem(pinned));
  }
  return items;
});

const isEmpty = computed(() => entries.value.length === 0);
</script>

<template>
  <section class="ranking">
    <div class="page-head">
      <div :id="CAPTION_ID" class="eyebrow">Classificação geral</div>
      <h1>Placar da fila</h1>
      <p class="lede">Confira os melhores guerreiros das OS por aqui.</p>
    </div>

    <div class="summary">
      <label class="sector-filter">
        <span>Setor</span>
        <select v-model="activeSector">
          <option v-for="sector in sectors" :key="sector" :value="sector">
            {{ sector }}
          </option>
        </select>
      </label>
      <span>{{ entries.length }} na fila</span>
      <span>{{ CASES.length }} chamados · {{ objectivesCount }} objetivos</span>
      <span v-if="isStaff" class="note"
        >Seu progresso não entra no placar.</span
      >
      <span v-else-if="myEntry">Você está em {{ myEntry.rank }}º</span>
      <span v-else-if="user">Você ainda não aparece aqui</span>
    </div>

    <p v-if="publishError" class="empty-note publish-error">
      {{ publishError }}
    </p>

    <p v-if="unassignedCount > 0" class="empty-note">
      {{ unassignedCount }}
      {{ unassignedCount === 1 ? "jogador ainda não" : "jogadores ainda não" }}
      escolheu setor, então
      {{ unassignedCount === 1 ? "não aparece" : "não aparecem" }}
      em nenhum recorte.
    </p>

    <p v-if="isEmpty" class="empty-note">
      Ninguém do setor {{ activeSector }} apareceu no placar ainda. Feche o
      primeiro objetivo e o seu nome aparecerá aqui.
    </p>

    <ul v-else class="rank-list" role="list" :aria-labelledby="CAPTION_ID">
      <template v-for="item in tableItems" :key="item.key">
        <li v-if="item.kind === 'separator'" class="separator">
          Sua posição no placar
        </li>
        <li v-else class="rank-line" :class="{ 'is-me': item.isMe }">
          <span class="pos">{{ item.entry.rank }}</span>
          <span class="name">
            {{ item.entry.name }}
            <span v-if="item.isMe" class="you">você</span>
          </span>
          <span class="xp">{{ formatXp(item.entry.xp) }} XP</span>
          <span class="cases">
            {{ item.entry.casesSolved }}/{{ CASES.length }}
          </span>
          <span class="badges">
            <RankBadge
              v-for="badge in item.badges"
              :key="badge"
              :badge="badge"
            />
          </span>
        </li>
      </template>
    </ul>

    <div v-if="!user" class="notice">
      <p class="notice-text">
        Todo mundo pode ver este placar, mas só quem entrou com uma conta
        aparece nele. Visitantes jogam offline e o progresso fica no próprio
        navegador.
      </p>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="pending"
        :aria-busy="pending"
        @click="loginWithGoogle"
      >
        {{ pending ? "Aguarde…" : "Entrar para aparecer no placar" }}
      </button>
    </div>

    <p class="footnote">
      Ranking e medalhas são separados entre os setores, se dedique chegar ao
      topo do seu.
    </p>

    <SectorPickerModal
      :open="showSectorModal"
      :saving="savingSector"
      @close="showSectorModal = false"
      @confirm="confirmSector"
    />
  </section>
</template>

<style scoped>
.ranking {
  padding: 3rem 5vw 5rem;
}

.page-head {
  max-width: 60ch;
  margin-bottom: 2.5rem;
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
.lede {
  font-size: 0.9rem;
  color: var(--ink-muted);
  margin: 0;
  max-width: 52ch;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.4rem;
  padding-bottom: 0.9rem;
  border-bottom: 0.063rem solid var(--rule);
  margin-bottom: 1.5rem;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  color: var(--ink-muted);
}

.sector-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.sector-filter select {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.8rem;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
}
.sector-filter select:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}
.note {
  color: var(--amber);
}

.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
}
.rank-line {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.55rem 0.2rem;
  border-bottom: 0.063rem dashed var(--rule);
}
.rank-line.is-me {
  background: var(--surface);
  border-left: 0.125rem solid var(--amber);
}
.pos {
  flex: none;
  width: 1.9rem;
  text-align: right;
  color: var(--ink-muted);
}
.name {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.xp {
  flex: none;
  min-width: 6.5rem;
  text-align: right;
}
.cases {
  flex: none;
  min-width: 3.8rem;
  text-align: right;
  color: var(--ink-muted);
}
.badges {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  min-width: 7rem;
  padding-right: 0.5rem;
}
.you {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amber);
  margin-left: 0.4rem;
}
.separator {
  color: var(--amber);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 1.2rem 0.2rem 0.4rem;
  border-bottom: 0.063rem solid var(--rule);
}

.notice {
  border: 0.063rem dashed var(--rule);
  border-radius: 0.25rem;
  padding: 1.5rem;
  margin-top: 2rem;
  max-width: 48ch;
}
.notice-text {
  font-size: 0.9rem;
  color: var(--ink-muted);
  margin: 0 0 1.1rem;
}

.btn {
  font-family: "IBM Plex Sans", sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 0.125rem;
  cursor: pointer;
  border: 0.063rem solid transparent;
  padding: 0.65rem 1.1rem;
}
.btn-primary {
  background: var(--amber);
  color: var(--bg);
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
.btn-primary:disabled {
  opacity: 0.55;
  cursor: progress;
}
.btn:focus-visible {
  outline: 0.125rem solid var(--amber);
  outline-offset: 0.125rem;
}

.empty-note {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.82rem;
  color: var(--ink-muted);
}
.publish-error {
  color: var(--stamp-red);
  border-left: 0.125rem solid var(--stamp-red);
  padding-left: 0.7rem;
}
.footnote {
  margin-top: 1.8rem;
  font-size: 0.8rem;
  color: var(--ink-muted);
  max-width: 70ch;
}

@media (max-width: 640px) {
  .rank-list {
    font-size: 0.78rem;
  }
  .rank-line {
    flex-wrap: wrap;
    gap: 0.35rem 0.7rem;
    padding: 0.5rem 0.2rem;
  }
  .name {
    flex: 1 1 6rem;
  }
  .badges {
    flex-basis: 100%;
    min-width: 0;
    justify-content: flex-start;
  }
}
</style>
