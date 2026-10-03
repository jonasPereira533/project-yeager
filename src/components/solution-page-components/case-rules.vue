<script setup lang="ts">
import { ref } from "vue";

const expanded = ref(true);
</script>

<template>
  <div class="dossier instructions" data-num="Manual">
    <div class="dossier-header">
      <div class="dossier-title">Como resolver um caso</div>
      <button class="toggle-btn" type="button" @click="expanded = !expanded">
        {{ expanded ? "Esconder" : "Mostrar" }}
      </button>
    </div>

    <div v-show="expanded">
      <p class="intro">
        Cada caso é dividido em objetivos. Resolva um de cada vez escrevendo uma
        consulta SQL que responda exatamente o que foi pedido.
      </p>

      <ul class="rules">
        <li>
          <span class="rule-label">Executar</span>
          <span>
            Escreva a consulta e clique em <strong>Investigar</strong> (ou use
            <strong>Ctrl/Cmd + Enter</strong>) pra rodar e conferir o resultado.
          </span>
        </li>
        <li>
          <span class="rule-label">Resultado</span>
          <span>
            Um carimbo <strong class="teal">CHAMADO RESOLVIDO</strong> aparece
            quando o resultado bate com o gabarito;
            <strong class="red">AINDA EM ABERTO</strong> quando ainda não bate.
          </span>
        </li>
        <li>
          <span class="rule-label">Dica</span>
          <span>
            Usar o botão de dica reduz o XP ganho naquele objetivo — trate a
            dica como um recurso limitado, não como um passo obrigatório.
          </span>
        </li>
        <li>
          <span class="rule-label">Esquema</span>
          <span>
            As tabelas e colunas disponíveis ficam listadas ao lado do editor —
            consulte sempre que precisar confirmar o nome de uma coluna.
          </span>
        </li>
        <li>
          <span class="rule-label">Erro de SQL</span>
          <span>
            Um erro de sintaxe só mostra um aviso técnico; não conta como
            tentativa errada contra o gabarito.
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dossier {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 2rem 2rem 1.6rem;
  margin-bottom: 2.2rem;
}
.dossier::before {
  content: attr(data-num);
  position: absolute;
  top: -0.9rem;
  left: 1.6rem;
  background: var(--surface-2);
  border: 1px solid var(--rule);
  padding: 0.25rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  border-radius: 2px;
}
.dossier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.1rem;
}
.dossier-title {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  text-transform: uppercase;
}
.toggle-btn {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  background: none;
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
}
.toggle-btn:hover {
  border-color: var(--amber);
  color: var(--ink);
}
.intro {
  color: var(--ink-muted);
  font-size: 0.95rem;
  margin-bottom: 1.2rem;
  max-width: 68ch;
}
.rules {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rules li {
  display: flex;
  gap: 0.8rem;
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--rule);
  font-size: 0.9rem;
  color: var(--ink);
  line-height: 1.5;
}
.rules li:last-child {
  border-bottom: none;
}
.rule-label {
  flex-shrink: 0;
  width: 6.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--amber);
}
.rules strong {
  font-weight: 600;
}
.teal {
  color: var(--teal);
}
.red {
  color: var(--stamp-red);
}
</style>
