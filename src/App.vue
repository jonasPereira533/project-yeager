<script setup lang="ts">
import AppFooter from "./components/shared-components/main-footer.vue";
import MainHeader from "./components/shared-components/main-header.vue";
</script>

<template>
  <a class="skip-link" href="#main">Pular para o conteúdo</a>
  <MainHeader />
  <main id="main">
    <router-view />
  </main>
  <AppFooter />
</template>

<style scoped>
main {
  flex: 1;
}
</style>
