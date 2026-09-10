<script setup lang="ts">
import MainHeader from "../components/shared-components/main-header.vue";
import CaseCatalog from "../components/case-page-components/case-list-page.vue";
import MainFooter from "../components/shared-components/main-footer.vue";

const emit = defineEmits<{
  "go-home": [];
  "select-case": [caseId: string];
}>();
</script>

<template>
  <main-header @go-home="emit('go-home')"></main-header>
  <case-catalog @select-case="(id) => emit('select-case', id)"></case-catalog>
  <main-footer></main-footer>
</template>