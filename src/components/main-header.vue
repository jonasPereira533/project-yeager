<script setup lang="pt-br">
</script>


<template>
  <header class="yeagar-header">
    <div class="logo">YEAGAR<span>.</span></div>

    <a href="#" class="login-link">Entrar</a>
  </header>
</template>


<style>

@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');


</style>

<style scoped>
.yeagar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 5vw;
  border-bottom: 1px solid var(--rule);
  background: var(--bg);
  font-family: 'IBM Plex Sans', sans-serif;
}

.logo {
  font-family: 'Special Elite', monospace;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  color: var(--ink);
}
.logo span {
  color: var(--amber);
}

.login-link {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.85rem;
  color: var(--ink-muted);
  text-decoration: none;
  border: 1px solid var(--rule);
  padding: 0.5rem 1rem;
  border-radius: 2px;
  transition: border-color 0.2s, color 0.2s;
}
.login-link:hover {
  border-color: var(--amber);
  color: var(--ink);
}
</style>