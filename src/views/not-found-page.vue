<script setup lang="ts"></script>

<template>
  <div class="not-found-page">
    <p class="eyebrow">Erro 404</p>
    <h1>Chamado não localizado</h1>
    <p class="message">
      O endereço que você abriu não corresponde a nenhum caso do arquivo.
      Confira o link ou volte para a lista.
    </p>
    <div class="actions">
      <RouterLink :to="{ name: 'main-page' }" class="btn btn-ghost"
        >Voltar ao início</RouterLink
      >
      <RouterLink :to="{ name: 'case-page' }" class="btn btn-primary"
        >Ver casos</RouterLink
      >
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  padding: 6rem 5vw 7rem;
  max-width: 60ch;
}
.eyebrow {
  font-family: "Special Elite", monospace;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--stamp-red);
}
h1 {
  font-family: "Special Elite", monospace;
  font-size: 2rem;
  margin: 0.6rem 0 1rem;
}
.message {
  font-size: 0.95rem;
  color: var(--ink-muted);
  margin: 0 0 2rem;
}
.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.btn {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
  color: var(--ink-muted);
  background: none;
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  text-decoration: none;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.btn:hover {
  border-color: var(--ink-muted);
  color: var(--ink);
}
.btn:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}
.btn-primary {
  background: var(--amber);
  border-color: var(--amber);
  color: #1a1305;
  font-weight: 600;
}
.btn-primary:hover {
  background: #f0ae4d;
  border-color: #f0ae4d;
  color: #1a1305;
}
</style>