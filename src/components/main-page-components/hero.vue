<script setup lang="ts">
const emit = defineEmits<{
  "go-to-cases": [];
}>();
</script>

<template>
  <section class="hero">
    <div>
      <div class="eyebrow">Treinamento interno — VR Tech</div>
      <h1>Aprenda SQL<br>resolvendo casos reais.</h1>
      <p>Yeager transforma o banco de dados da VR Tech em uma investigação. Escolha um caso, escreva a consulta certa e descubra o que os registros têm a esconder.</p>
      <div class="cta-row">
        <a href="#" class="btn btn-ghost" @click.prevent="emit('go-to-cases')">Ver Casos</a>

        <a href="https://github.com/jonasPereira533/project-yeager" target="_blank" class="btn btn-ghost">GitHub</a>
      </div>
    </div>

    <!-- Card lateral -->
    <div class="welcome-card">
      <i class="ti ti-hat-cowboy card-icon" aria-hidden="true"></i>
      <h2>Bem-vindo, Tecnico #nome </h2>
      <p>A fila esta cheia de atendimentos, precisamos de você para resolver.</p>
      <a href="#" class="btn btn-primary" @click.prevent="emit('go-to-cases')">Resolver casos</a>
    </div>
  </section>

  <!-- Como Jogar  -->
  <div class="como-jogar-wrap">
    <a href="#como-jogar" class="como-jogar">↓ Como Jogar ↓</a>
  </div>

</template>

<style scoped>
.hero{
  display:grid;
  grid-template-columns:1.1fr 0.9fr;
  gap:4rem;
  padding:9rem 9vw 6rem;
  align-items:center;
}
.hero h1{
  font-family:'Special Elite', monospace;
  font-size:clamp(2rem, 3.6vw, 3.1rem);
  line-height:1.2;
  margin:1rem 0 1.4rem;
  max-width:11ch;
}
.hero p{
  color:var(--ink-muted);
  font-size:1.05rem;
  max-width:46ch;
  margin-bottom:2rem;
}
.cta-row{ display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }

.btn{
  font-family:'IBM Plex Mono', monospace;
  font-weight:100;
  font-size:0.95rem;
  padding:0.85rem 1.6rem;
  border-radius:2px;
  text-decoration:none;
  display:inline-block;
  cursor:pointer;
  border:1px solid transparent;}

.btn-primary{ background:var(--amber); color:#1A1305; font-family: 'IBM Plex Mono', monospace }
.btn-primary:hover{ background:#f0ae4d; }
.btn-ghost{ border-color:var(--rule); color:var(--ink-muted); font-family: 'IBM Plex Mono', monospace }
.btn-ghost:hover{ border-color:var(--ink-muted); }

.eyebrow{
  font-family:'Special Elite', monospace;
  font-size:0.78rem;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:var(--amber);
}

/* Card lateral  */
.welcome-card{
  position: relative;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 12px;
  padding: 4rem 5rem 6rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  align-self: center;
}
.card-icon{
  font-size: 48px;
  color: var(--amber);
  margin-bottom: 0.5rem;
}
.welcome-card h2{
  font-family: 'Special Elite', monospace;
  font-size: 1.4rem;
  color: var(--ink);
  margin: 0;
}
.welcome-card p{
  color: var(--ink-muted);
  font-size: 0.95rem;
  max-width: 32ch;
  margin: 0 0 0.5rem;
}

/* Como jogar   */
.como-jogar-wrap{
  display: flex;
  justify-content: center;
  padding-bottom: 4rem;
}
.como-jogar{
  border: 1px solid var(--rule);
  padding: 0.6rem 1.4rem;
  border-radius: 4px;
  font-family: 'Special Elite', monospace;
  font-size: 0.85rem;
  color: var(--ink-muted);
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}
.como-jogar:hover{
  border-color: var(--ink-muted);
  color: var(--ink-muted);
}

</style>