<script setup lang="ts">

</script>

<template>
  <section id="como-jogar" class="section">
    <div class="section-head">
      <div class="eyebrow">Como funciona</div>
      <h2>Da pista à consulta</h2>
    </div>
    <div class="steps">
      <div class="step">
        <div class="step-num">01</div>
        <h3>Receba o caso</h3>
        <p>Leia o contexto e entenda o que precisa descobrir.</p>
      </div>
      <div class="step">
        <div class="step-num">02</div>
        <h3>Explore as tabelas</h3>
        <p>Investigue a estrutura do banco disponível.</p>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <h3>Escreva a consulta</h3>
        <p>Monte o SQL que revela a resposta.</p>
      </div>
      <div class="step">
        <div class="step-num">04</div>
        <h3>Resolva o mistério</h3>
        <p>Confirme o resultado e avance de nível.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <div class="eyebrow">Niveis</div>
      <h2>Escolha seu grau de investigação</h2>
    </div>
    <div class="levels">
      <div class="level">
        <h3>Iniciante</h3>
        <p>Consultas simples, uma tabela por vez. Ideal pra quem está pegando o jeito do SQL.</p>
      </div>
      <div class="level mid">
        <h3>Intermediário</h3>
        <p>Junções entre tabelas e filtros.</p>
      </div>
      <div class="level high">
        <h3>Avançado</h3>
        <p>Casos complexos com múltiplas junções, subconsultas e pistas escondidas.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Como funciona */
.section{ padding:4.5rem 5vw; border-top:1px solid var(--rule); }
.section-head{ margin-bottom:2.6rem; max-width:50ch; margin-top: 3rem}
.section-head h2{
  font-family:'Special Elite', monospace;
  font-size:1.7rem;
  margin-top:0.6rem;
}
.steps{
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  gap:1.5rem;
}
.step{
  background:var(--surface);
  border:1px solid var(--rule);
  border-radius:4px;
  padding:0.5rem;
}
.step-num{
  font-family:'IBM Plex Mono', monospace;
  color:var(--amber);
  font-size:0.85rem;
  margin-bottom:0.6rem;
}
.step h3{ font-size:1rem; margin-bottom:0.4rem; }
.step p{ font-size:0.88rem; color:var(--ink-muted); }

/* Níveis */
.levels{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:1.5rem;
}
.level{
  background:var(--surface);
  border:1px solid var(--rule);
  border-left:4px solid var(--teal);
  border-radius:4px;
  padding:0.5rem;
}
.level.mid{ border-left-color:var(--amber); }
.level.high{ border-left-color:var(--stamp-red); }
.level h3{
  font-family:'IBM Plex Mono', monospace;
  font-size:0.95rem;
  letter-spacing:0.04em;
  margin-bottom:0.6rem;
}
.level p{ font-size:0.9rem; color:var(--ink-muted); }

.eyebrow{
  font-family:'Special Elite', monospace;
  font-size:0.78rem;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:var(--amber);
}

</style>
