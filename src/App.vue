<script setup lang="ts">
import AppFooter from "./components/shared-components/main-footer.vue";
import MainHeader from "./components/shared-components/main-header.vue";
</script>

<template>
  <MainHeader />
  <main>
    <router-view />
  </main>
  <AppFooter />
</template>

<style scoped>
main {
  flex: 1;
}
</style>
