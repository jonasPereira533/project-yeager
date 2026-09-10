<script setup lang="ts">

</script>

<template>
  <header>
    <div class="logo">YEAGAR<span>.</span></div>
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