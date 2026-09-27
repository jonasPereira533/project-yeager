<script setup lang="ts">
import CaseListPage from "../components/case-page-components/case-list-page.vue";

const emit = defineEmits<{
  "go-home": [];
  "select-case": [caseId: string];
}>();
</script>

<template>
  <case-list-page
    @select-case="(id) => emit('select-case', id)"
  ></case-list-page>
</template>
