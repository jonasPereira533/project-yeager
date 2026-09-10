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

// TODO: quando a tela de resolução de caso (views/case-page.vue) for
// plugada aqui, tratar esse evento pra abrir o caso escolhido.
function onSelectCase(caseId: string) {
  console.log('Caso selecionado:', caseId)
}
</script>

<template>
  <home-page v-if="currentView === 'home'" @go-to-cases="goToCases"></home-page>
  <cases-page v-else @go-home="goHome" @select-case="onSelectCase"></cases-page>
</template>