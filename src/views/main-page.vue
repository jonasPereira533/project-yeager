<script setup lang="ts">
import MainHeader from "../components/shared-components/main-header.vue";
import Hero from "../components/main-page-components/hero.vue";
import Instructions from "../components/main-page-components/instructions.vue";
import MainFooter from "../components/shared-components/main-footer.vue";

const emit = defineEmits<{
  "go-to-cases": [];
}>();
</script>

<template>
  <main-header></main-header>
  <hero @go-to-cases="emit('go-to-cases')"></hero>
  <instructions></instructions>
  <main-footer></main-footer>
</template>