<script setup lang="ts">
import {useRouter} from "vue-router";

const router = useRouter();

const goToMainPage = () => {
  router.push({name: 'main-page'});
}
</script>

<template>
  <header>
    <button type="button" class="logo" @click="goToMainPage">
      YEAGAR<span>.</span>
    </button>
    <div class="nav-links">
      <a href="#" class="login-link">Entrar</a>
      <a href="#" class="login-link">Criar</a>
    </div>
  </header>
</template>

<style scoped>
header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:1.5rem 5vw;
  border-bottom:1px solid var(--rule);
}
.logo{
  font-family:'Special Elite', monospace;
  font-size:1.3rem;
  letter-spacing:0.06em;
  background:none;
  border:none;
  color:var(--ink);
  padding:0;
  cursor:pointer;
}
.logo span{ color:var(--amber); }
.nav-links{
  display:flex;
  align-items:center;
  gap: 2rem;
}
.login-link{
  font-family:'IBM Plex Mono', monospace;
  font-size:0.85rem;
  color:var(--ink-muted);
  text-decoration:none;
  border:1px solid var(--rule);
  padding:0.5rem 1rem;
  border-radius:2px;
  transition:border-color 0.2s, color 0.2s;
}
.login-link:hover{ border-color:var( --ink-muted); color:var(--ink); }
</style>