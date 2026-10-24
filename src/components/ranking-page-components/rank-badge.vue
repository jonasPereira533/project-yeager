<script setup lang="ts">
import { computed } from "vue";
import { BADGE_LABELS, type RankBadge } from "../../utils/ranking";

const props = defineProps<{
  badge: RankBadge;
}>();

const ICONS: Record<RankBadge, string> = {
  first: "/completeAll.svg",
  gold: "/firstPlace.svg",
  silver: "/secondPlace.svg",
  bronze: "/thirdPlace.svg",
  noHints: "/noHints.svg",
};

const icon = computed(() => ICONS[props.badge]);
const label = computed(() => BADGE_LABELS[props.badge]);
</script>

<template>
  <img :src="icon" :alt="label" :title="label" class="badge-icon" />
</template>

<style scoped>
.badge-icon {
  display: block;
  flex: none;
  width: 2rem;
  height: 2rem;
}
</style>
