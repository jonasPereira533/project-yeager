<script setup lang="ts">
import Hero from "../components/main-page-components/hero.vue";
import Instructions from "../components/main-page-components/instructions.vue";

const emit = defineEmits<{
  "go-to-cases": [];
}>();
</script>

<template>
  <hero @go-to-cases="emit('go-to-cases')"></hero>
  <instructions></instructions>
</template>
