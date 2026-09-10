<template>
  <footer>
    <div class="footer-links">
      <a>Sugerir um caso</a>
      <a>Ver repositório no Github</a>
    </div>
    <div class="footer-note">Yeager.</div>
  </footer>
</template>

<style scoped>
footer {
  padding: 3rem 5vw;
  border-top: 0.063rem solid var(--rule);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.footer-links {
  display: flex;
  gap: 1.6rem;
}
.footer-links a {
  color: var(--ink-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-family: var(--font-mono);
}
.footer-links a:hover {
  color: var(--amber);
}
.footer-note {
  font-size: 0.8rem;
  color: var(--ink-muted);
}
</style>
