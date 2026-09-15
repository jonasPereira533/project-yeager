<script setup lang="ts">
import { ref } from 'vue'
import HomePage from './views/main-page.vue'
import CasesPage from './views/case-page.vue'

type View = 'home' | 'cases'

const currentView = ref<View>('home')

function goToCases() {
  currentView.value = 'cases'
}

function goHome() {
  currentView.value = 'home'
}


function onSelectCase(caseId: string) {
  console.log('Caso selecionado:', caseId)
}
</script>

<template>
  <router-view/>
</template>