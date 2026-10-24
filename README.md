<div align="center">
  <img src="./public/yeagar_favicon_db_v2.svg" width="88" alt="Yeager — banco de dados com lupa" />

  <h1>YEAGER<span style="color:#e8a33d">.</span></h1>

  <p><strong>Aprenda SQL resolvendo casos reais de banco de dados — direto no navegador.</strong></p>
  <p>
    Yeager é o laboratório de treinamento interno da <strong>VR Tech</strong>: cada tabela do
    sistema de gestão vira um chamado de suporte técnico, e cada chamado vira uma consulta SQL
    que você precisa acertar. SQLite compilado para WebAssembly, zero servidor, zero upload.
  </p>

  <p>
    <a href="https://project-yeager.vercel.app">
      <img src="https://img.shields.io/badge/Demo-Abrir%20o%20Yeager-e8a33d?logo=playwright&logoColor=black" alt="Abrir a demo do Yeager" />
    </a>
    <a href="https://github.com/jonasPereira533/project-yeager">
      <img src="https://img.shields.io/badge/Código-fonte-42b883?logo=github&logoColor=black" alt="Repositório no GitHub" />
    </a>
    <img src="https://img.shields.io/badge/vers%C3%A3o-v0.6.0-e8a33d" alt="Versão v0.6.0" />
  </p>

  <p>
    <a href="./.github/workflows/ci.yml">
      <img src="https://github.com/jonasPereira533/project-yeager/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI: typecheck, lint, build e audit" />
    </a>
    <img src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs" alt="Vue 3.5" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white" alt="TypeScript 6" />
    <img src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" alt="Vite 8" />
    <img src="https://img.shields.io/badge/SQLite%20via%20sql.js-WASM-003b57?logo=sqlite" alt="SQLite rodando no navegador via sql.js" />
    <img src="https://img.shields.io/badge/CodeMirror-6-ffffff?logo=codemirror&logoColor=000000" alt="CodeMirror 6" />
    <img src="https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase" alt="Firebase 12" />
    <img src="https://img.shields.io/badge/vitest-6e9f37?logo=vitest" alt="Vitest" />
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/Licença-MIT-e8a33d" alt="Licença MIT" />
    </a>
  </p>

  <p><em>Treinamento interno · JJ Informática · dados dos casos 100% fictícios</em></p>
</div>

---

## Índice

- [Sobre](#sobre)
- [O problema](#o-problema)
- [Como funciona](#como-funciona)
- [Casos disponíveis](#casos-disponíveis)
- [Níveis, XP e dicas](#níveis-xp-e-dicas)
- [Recursos](#recursos)
- [Banco de dados dos casos](#banco-de-dados-dos-casos)
- [Stack](#stack)
- [Testes](#testes)
- [Rodando localmente](#rodando-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Firebase e progresso](#firebase-e-progresso)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts](#scripts)
- [Integração contínua](#integração-contínua)
- [FAQ](#faq)
- [Contribuindo](#contribuindo)
- [Créditos](#créditos)
- [Licença](#licença)

---

## Sobre

Yeager nasceu para resolver um problema comum em equipes de suporte: o técnico aprende SQL na
teoria e trava na prática. Aqui a prática é a primeira coisa — o banco já está montado, o
chamado já está aberto e a única saída é a consulta certa.

Cada caso carrega um contexto real de atendimento (um cliente que não fecha venda, um caixa que
nunca fechou, itens vendidos fora do preço de tabela), um banco SQLite em memória com dados
fictícios, e três objetivos que precisam ser respondidos. A validação compara o **conjunto de
linhas** devolvido pela sua consulta com o gabarito — a ordem das linhas e das colunas não importa,
então você pensa em _o que o caso pede_, e não em como o avaliador vai comparar.

Tudo acontece dentro do navegador: o SQLite vem do `sql.js` (WASM) e nenhum dado sai da máquina.

## O problema

| O que trava o técnico hoje              | O que o Yeager faz                                                |
| --------------------------------------- | ----------------------------------------------------------------- |
| `SELECT * FROM ...` e torcer            | Casos com pergunta objetiva e resposta verificável                |
| Copiar consulta de fórum e não entender | Vocabulário real: `Cli_For`, `Movimento_Produto`, chaves com `__` |
| Banco de produção intocável             | Banco fictício, recriado a cada caso, sem risco                   |
| Praticar sem perder nada                | Consultas ilimitadas — errar não custa nada                       |
| SQL é matéria de faculdade              | SQL é ferramenta de quem resolve chamado às 9h da manhã           |

## Como funciona

1. **Receba o caso** — leia o dossiê (contexto, categoria, tabelas envolvidas) e as regras da
   investigação.
2. **Explore o esquema** — o painel ao lado do editor lista as tabelas do caso e todas as colunas
   disponíveis, lidas direto do banco via `PRAGMA table_info`.
3. **Escreva a consulta** — editor CodeMirror com dialeto SQLite, highlight, autocomplete de
   tabelas/colunas em dois níveis (`Tabela.` abre as colunas) e atalho `Ctrl/Cmd + Enter` para rodar.
   Colunas `BOOLEAN` do esquema aceitam `true`/`false` tanto quanto `1`/`0`.
4. **Confirme o resultado** — o carimbo mostra `CHAMADO ENCERRADO` quando a resposta bate com o
   gabarito e `AINDA EM ABERTO` quando ainda não bate, com uma linha explicando o que não conferiu
   (quantidade de linhas, de colunas ou valores). Errar de sintaxe só devolve o erro técnico do
   SQLite, sem penalidade.
5. **Feche o caso** — zerados os três objetivos, o caso entra no modo "concluído" com o resumo de
   XP e um atalho para o próximo caso.

Cada objetivo guarda seu próprio rascunho, por caso: saia do caso, volte depois e o editor retoma
onde você parou, inclusive o objetivo selecionado.

## Casos disponíveis

16 casos, 47 objetivos, 1450 XP no total. Todos vieram do `etrade2.sql`, o banco do sistema de gestão
usado pela VR Tech (módulos de vendas, estoque, financeiro, fiscal e permissões).

| Nº  | Caso                                                  | Nível         | Categoria                           | Tabelas                                               | XP  |
| --- | ----------------------------------------------------- | ------------- | ----------------------------------- | ----------------------------------------------------- | --- |
| 001 | Clientes Bloqueados no Cadastro                       | Iniciante     | Suporte Técnico — Cadastro          | `Cli_For`                                             | 45  |
| 002 | Produtos Abaixo do Estoque Mínimo                     | Iniciante     | Suporte Técnico — Estoque           | `Estoque_Atual`                                       | 45  |
| 003 | Motivos de Cancelamento Bagunçados                    | Iniciante     | Suporte Técnico — Configuração      | `MotivoCancelamento`                                  | 45  |
| 004 | Vendas que Sumiram do Fechamento                      | Intermediário | Suporte Técnico — Caixa             | `Movimento`, `Cli_For`                                | 65  |
| 005 | Itens Vendidos Fora do Preço de Tabela                | Intermediário | Suporte Técnico — Vendas            | `Movimento_Produto`, `Produto`                        | 65  |
| 006 | Caixas que Nunca Fecharam                             | Intermediário | Suporte Técnico — Financeiro        | `Financeiro_Caixa_Mov`, `Caixas`                      | 65  |
| 007 | Clientes de Compra Única Acima da Média               | Avançado      | Suporte Técnico — Marketing/Vendas  | `Movimento`, `Cli_For`                                | 90  |
| 008 | Produtos Vendidos com Prejuízo                        | Avançado      | Suporte Técnico — Financeiro/Fiscal | `Movimento_Produto`, `Produto`                        | 90  |
| 009 | Ranking de Vendedores por Filial                      | Avançado      | Suporte Técnico — Comercial         | `Movimento`, `Funcionario`                            | 100 |
| 010 | ICMS Desonerado Preso em Nota de Devolução            | Avançado      | Suporte Técnico — Fiscal            | `Movimento`, `Movimento_Produto`, `Filial`, `Cli_For` | 135 |
| 011 | Valor Final Divergente após Zerar o IPI               | Avançado      | Suporte Técnico — Financeiro/Fiscal | `Movimento`, `Movimento_Produto`                      | 135 |
| 012 | Vencimento de Parcela Fora do Padrão                  | Avançado      | Suporte Técnico — Financeiro        | `Movimento`, `Movimento_NFe`, `Movimento_Financeiro`  | 135 |
| 013 | Caixa que Não Fecha por Funcionário Inativo           | Avançado      | Suporte Técnico — Caixa/RH          | `Financeiro_Caixa_Mov`, `Funcionario`                 | 135 |
| 014 | Bug do Troco Subtraindo o Total da Forma de Pagamento | Avançado      | Suporte Técnico — Financeiro        | `Movimento_Financeiro_Diario`                         | 135 |

## Níveis, XP e dicas

| Nível         | O que é exercitado                                                                   | Casos | XP do nível |
| ------------- | ------------------------------------------------------------------------------------ | ----- | ----------- |
| Iniciante     | Uma tabela por vez, `WHERE`, `ORDER BY`, `GROUP BY`                                  | 3     | 135         |
| Intermediário | Junções entre tabelas e filtros combinados                                           | 3     | 195         |
| Avançado      | Múltiplas junções, subconsultas, CTE, window function, agregação e pistas escondidas | 8     | 955         |

- Cada objetivo tem XP próprio (de 10 a 60), exibido na lista de objetivos.
- Pedir a **dica** de um objetivo custa **-5 XP** naquele objetivo. Dica é recurso limitado, não
  passo obrigatório.
- Sem login, o progresso fica só na memória da aba. Fazendo login com Google, ele vai para o
  Firestore e volta em qualquer máquina — inclusive migrando o progresso que já era seu como
  visitante.

## Recursos

**Investigação**

- Casos com dossiê (briefing), regras e objetivos independentes, navegáveis por abas.
- Esquema do banco lido em tempo de execução (`sqlite_master` + `PRAGMA table_info`) e mostrado
  ao lado do editor — nunca um schema hardcoded.
- Editor CodeMirror 6 com dialeto SQLite case-insensitive, autocomplete de tabelas e colunas em dois
  níveis conforme o caso muda, `Tab` para indentar, quebra de linha automática e tema próprio (âmbar
  sobre fundo escuro).
- As colunas oferecidas são as das tabelas que a frase atual usa de verdade. O `lang-sql` sozinho só
  completa coluna depois do ponto (`Cli_For.`); uma segunda fonte de autocomplete lê o `FROM` e
  completa também no `SELECT`, no `WHERE`, no `GROUP BY` e no `ORDER BY`. Com uma tabela no escopo a
  coluna aparece crua, com duas ou mais vem qualificada (`Cli_For.Nome`) — `Nome` existe em cinco
  tabelas do app, e sem o prefixo o SQLite resolveria pelo primeiro nome que achasse.
- O autocomplete pode ser desligado pelo botão ao lado de **Investigar**, para escrever a consulta do
  zero sem o editor entregando nome de tabela e coluna. A escolha fica no `localStorage`, sobrevive
  ao refresh e vale para todos os casos; o padrão continua ligado.

**Validação**

- Comparação por conjunto de linhas, sem o resultado precisar ser idêntico ao gabarito:
  - ordem das linhas **e** das colunas dentro da linha não importam;
  - a quantidade de linhas e de colunas precisa bater exatamente, e duplicatas contam;
  - valores são tolerantes: `10` casa com `'10'`, `São Paulo` com `sao paulo`, `''` com `NULL`, e
    números comparam com tolerância de ponto flutuante em vez de arredondamento fixo — assim
    `AVG()` sem `ROUND()` bate com o gabarito, mas uma diferença real de centavo reprova;
  - qualquer instrução da sua consulta pode conter o resultado, então um `SELECT` de debug no fim
    não afunda uma resposta certa.
- Quando não bate, o carimbo diz o quê: linhas a mais ou a menos, número de colunas diferente, ou
  valores que divergem.
- Erros de sintaxe devolvem a mensagem real do SQLite: dá pra depurar de verdade.
- O gabarito de cada objetivo roda no mesmo banco em memória da sua consulta — sem servidor de
  validação, sem uploading de query.

**Progresso**

- XP total no header, casos resolvidos marcados com ✔ no catálogo.
- Modal de conclusão por caso, com resumo de XP, dicas usadas e atalho para o próximo caso.
- Rascunho por caso **e** por objetivo: o editor retoma a consulta e o objetivo onde você parou, com
  escrita no Firestore com debounce para nãovspassar a cada tecla.
- Sem login o rascunho fica no `localStorage` — não some no refresh, que é justamente o caso que
  dói. Fazendo login, ele vai para o Firestore junto com o progresso e volta em qualquer máquina.
- Login opcional com Google (Firebase Auth) e progresso por usuário no Firestore, com regras de
  segurança que permitem apenas leitura/escrita do próprio documento e apenas crescimento de
  progresso — nada de trancar XP, deletar histórico ou escrever chave de outra pessoa.
- Placar em `/ranking`: todo mundo logado ordenado por XP, com os 20 primeiros e a sua linha
  presa no fim quando ela não cabe no corte. O XP do placar é o mesmo do header, calculado pela
  mesma função.
- O placar é dividido por setor (`Partner`, `Final`, `Prime`, `Implantação`, `Outro`), escolhido uma
  vez na primeira visita. Todos os selos são por setor: trocar o setor no seletor troca o resultado.
- Quem está em `devs/` no Firestore fica fora do placar inteiro, para o progresso de quem escreve o
  jogo não competir com quem joga.

**Selos** — todos do setor aberto

- `1º` `2º` `3º` para os três primeiros do seu setor.
- `SEM NENHUMA DICA` para quem fechou os 16 chamados sem abrir uma única dica.
- `PRIMEIRO A FECHAR A FILA` para o primeiro do setor a fechar tudo, com o horário carimbado pelo
  servidor e congelado pelas regras, então não dá para tomar o selo depois.

**Experiência**

- Tema noir coerente com a identidade do produto (fundo `#14171c`, âmbar `#e8a33d`).
- Confirmação do próprio navegador antes de recarregar com trabalho não conferido: some depois de
  rodar a consulta e volta a aparecer na hora que você mexe no texto de novo. O aviso é o nativo —
  desde o Chrome 88 e o Firefox 115 o navegador ignora qualquer texto customize —, e o listener só
  fica registrado enquanto há o que proteger, para não desligar o cache de ida e volta.
- Tipografia de máquinas de escrever (`Special Elite`) para títulos e `IBM Plex Mono` para o
  conteúdo técnico — o mesmo par do app.
- Layout responsivo, navegação por teclado, `aria-*` nos componentes interativos, skip link e
  página 404 com a identidade do produto.

## Banco de dados dos casos

Cada caso é um objeto TypeScript em `src/data/cases.ts` com quatro peças:

```ts
{
  id: "clientes-bloqueados",
  caseNumber: "001",
  title: "Clientes Bloqueados no Cadastro",
  level: "Iniciante",
  category: "Suporte Técnico — Cadastro",
  tables: "Cli_For",
  context: "Um atendente relatou que alguns clientes não conseguem fechar venda…",
  setupSQL: `CREATE TABLE Cli_For (...); INSERT INTO Cli_For VALUES (...);`,
  objectives: [
    {
      id: "o1",
      xp: 10,
      question: "Liste nome, cidade e UF de todos os clientes bloqueados.",
      hint: "Use WHERE pra filtrar por um campo booleano. Vale tanto Bloqueado = 1 quanto Bloqueado = true.",
      refSQL: "SELECT Nome, Cidade, UF FROM Cli_For WHERE Bloqueado = 1;",
    },
  ],
}
```

Regras de autoria que o projeto segue:

- O `setupSQL` cria as tabelas e popula os dados; é ele que monta o banco em memória do caso.
- Todo `refSQL` foi **validado rodando de fato** contra o `setupSQL` antes de entrar no arquivo.
- Os esquemas foram simplificados (poucas colunas por tabela) a partir das tabelas reais, que no
  sistema original têm dezenas de colunas cada.
- Nomes de tabela e coluna seguem a convenção real do sistema (PascalCase, chaves estrangeiras com
  `__`, ex.: `Cli_For__Codigo`) — de propósito: quem resolve os casos pratica o vocabulário que
  vai encontrar em produção.
- Todos os dados de clientes, funcionários e valores são fictícios.

## Stack

| Camada       | Tecnologia                                                                                         | Por quê                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Interface    | [Vue 3.5](https://vuejs.org) (`<script setup>`, Composition API)                                   | componentes pequenos e legíveis                                      |
| Linguagem    | [TypeScript 6](https://www.typescriptlang.org)                                                     | tipos compartilhados entre caso, motor e UI                          |
| Build        | [Vite 8](https://vite.dev)                                                                         | HMR rápido e chunks separados para Firebase e para o editor          |
| Rotas        | [vue-router 5](https://router.vuejs.org)                                                           | rotas `/`, `/cases`, `/solution` + 404                               |
| Motor SQL    | [sql.js 1.14](https://sql.js.org)                                                                  | SQLite em WebAssembly dentro do navegador, sem servidor              |
| Editor       | [CodeMirror 6](https://codemirror.net) + `@codemirror/lang-sql`                                    | dialeto SQLite e autocomplete                                        |
| Auth & dados | [Firebase 12](https://firebase.google.com) + [vuefire 3](https://vuefire.vuejs.org)                | Google Auth e progresso por usuário                                  |
| Testes       | [vitest](https://vitest.dev)                                                                       | regras da comparação, autocomplete e sincronia com `firestore.rules` |
| Qualidade    | [ESLint 9](https://eslint.org) (flat config, `eslint-plugin-vue`, `typescript-eslint`) + `vue-tsc` | lint e typecheck no CI                                               |

## Testes

`npm run test` roda a suíte vitest (285 testes, sem navegador e sem rede — o sql.js e o parser do
CodeMirror rodam em node). Ela cobre o que dá para testar sem DOM:

- **As regras da comparação** (`src/utils/compare-results.spec.ts`) — uma testaria por regra, mais
  o comportamento do `toQueryResult` na hora de limpar o cabeçalho de coluna.
- **Os gabaritos de verdade** (`src/utils/compare-results.cases.spec.ts`) — roda os 47 `refSQL` de
  todos os casos contra o próprio `setupSQL` e confirma que continuam casando. É o que garante que
  afrouxar a comparação não quebrou nenhum gabarito, e que linhas embaralhadas continuam valendo.
- **O `firestore.rules`** (`src/composables/use-drafts.spec.ts`) — confere que a allowlist de
  `validCaseIds()` bate com `src/data/cases.ts` e que `draftsByCase` ficou de fora da regra de
  monotonicidade.
- **As regras do placar, por leitura de fonte** (`src/utils/leaderboard-rules.spec.ts`) — confere que
  os campos que o cliente escreve são os que o `hasOnly` aceita, que o teto do nome é o mesmo dos
  dois lados, que toda chave que o cliente monta está na allowlist das regras, que
  `validSectorIds()` bate com `SECTORS` e que `devs/` não aceita escrita.
- **As regras do placar, executadas de verdade** (`src/firestore.rules.spec.ts`, `npm run test:rules`)
  — 38 testes que sobem o emulador do Firestore e rodam o `firestore.rules`: quem pode escrever o quê,
  se as listas só crescem, se o carimbo de `completedAt` e o setor ficam congelados, se `devs/` recusa
  escrita e se o progresso não encolhe. Precisa de Java (veja [Testando as regras](#testando-as-regras)).
- **A ordenação e os selos** (`src/utils/ranking.spec.ts`, `src/utils/xp.spec.ts`) — a cascata de
  desempate do placar, o corte por setor, a exclusão de devs antes de ordenar, as três regras de selo
  e a fórmula única de XP.
- **O autocomplete** (`src/composables/use-sql-codemirror.spec.ts`) — que a fonte de completamento
  real do `lang-sql` devolve tabela como `class`, coluna como `property` e nenhuma sugestão
  embrulhada em crase.

## Testando as regras

As regras do Firestore rodam de verdade contra o [emulador](https://firebase.google.com/docs/emulator-suite),
que é um processo Java:

```bash
npm run test:rules
```

O comando sobe o emulador num projeto `demo-yeager` — sem credencial, sem rede e sem tocar em
produção —, executa `src/firestore.rules.spec.ts` e derruba o emulador no fim. O bloco `emulators`
no `firebase.json` define a porta 8080.

O que precisa estar instalado:

- **Java 11 ou superior.** No Ubuntu: `sudo apt install -y default-jre-headless`.
- **`firebase-tools`**, que já está nas `devDependencies`. A CLI local basta — o `npm run test:rules`
  acha o binário pelo `node_modules/.bin`.

O CI roda o mesmo comando, com `actions/setup-java` fixando a versão do Java.

Para depurar com o emulador no ar:

```bash
npx firebase emulators:start --only firestore --project demo-yeager
# em outro terminal
npx vitest run --config vitest.rules.config.ts
```

## Rodando localmente

**Pré-requisitos:** Node.js `^20.19.0 || >=22.12.0` e npm.

```bash
# 1. Clone o repositório
git clone https://github.com/jonasPereira533/project-yeager.git
cd project-yeager

# 2. Instale as dependências
npm ci

# 3. Crie o arquivo de ambiente
cp .env.example .env.local   # preencha as chaves VITE_FIREBASE_* (veja a seção abaixo)

# 4. Suba o servidor de desenvolvimento
npm run dev
```

O app abre em `http://localhost:5173`. Se preferir não instalar nada, a
[demo online](https://project-yeager.vercel.app) roda a mesma build em produção.

Para testar o build de produção localmente:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

O `.env` está no `.gitignore` — cada ambiente (e a CI) define suas próprias chaves `VITE_FIREBASE_*`.
O [`./.env.example`](./.env.example) lista exatamente quais são. Sem elas o app ainda abre, mas o
login e a sincronização de progresso não funcionam.

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

O prefixo `VITE_` é obrigatório: é assim que o Vite expõe variáveis para o bundle do cliente. Use a
configuração do app **web** do Firebase e mantenha a proteção de verdade no lado do servidor —
regras do Firestore e domínios autorizados no Google Auth. O `apiKey` de um app web é público por
definição; quem protege o dado são as regras.

## Firebase e progresso

- **Auth:** login por popup do Google. Cancelar o popup não gera erro na tela; falha de rede ou de
  popup bloqueado mostra aviso e deixa você tentar de novo.
- **Firestore:** um documento por usuário em `users/{uid}`, com três campos:

  ```ts
  {
    solvedByCase: { "clientes-bloqueados": ["o1", "o2"] },
    hintsUsedByCase: { "clientes-bloqueados": ["o3"] },
    draftsByCase: {
      "clientes-bloqueados": {
        activeObjectiveId: "o2",
        queries: { o1: "SELECT Nome, Cidade FROM Cli_For …" },
      },
    },
  }
  ```

- **Regras (`firestore.rules`):** leitura e escrita apenas do próprio documento, somente os três
  campos acima, apenas IDs de caso e objetivo de uma allowlist, delete bloqueado e progresso
  **monótono** (só adiciona objetivo resolvido/dica, nunca remove) — ou seja, ninguém consegue
  inflar XP nem apagar histórico pelo cliente. `draftsByCase` fica de fora dessa regra de
  monotonicidade de propósito: rascunho é sobrescrito a cada tecla, então precisa poder encolher.

Publicando as regras com o [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm run rules:deploy
```

Esse comando **guarda uma cópia datada** das regras em `~/.yeager-rules/` antes de publicar, e
depois chama `firebase deploy --only firestore:rules`. Se algo der errado:

```bash
npm run rules:rollback          # volta para a última cópia guardada
npm run rules:rollback e06960d  # volta para as regras de um commit
```

O `firebase.json` do repositório já aponta `firestore.rules` para a raiz, e o `.firebaserc` já vem
com o projeto `yeager-396bf` nos aliases `default` e `production` — por isso não precisa de
`firebase init` nem de `firebase use`. Se você estiver publicando em outro projeto, use
`firebase use --add` antes.

> ⚠️ **Só `e06960d` (e o que vem depois dele) é um alvo de rollback seguro.** As versões mais
> antigas do `firestore.rules` usam `data.values().all(...)`, que não existe na linguagem das
> regras: elas compilam, o deploy passa limpo, e na hora de avaliar nega a escrita do progresso do
> jogo. A tabela completa está no [DEPLOY-FIRESTORE.md](./DEPLOY-FIRESTORE.md).

> **Publicando pela primeira vez, ou passando o bastão para outra pessoa?** Siga o
> [DEPLOY-FIRESTORE.md](./DEPLOY-FIRESTORE.md) — traz o passo a passo com verificação e rollback, e
> explica por que o placar abre vazio logo depois do deploy.

> Ao **adicionar um caso novo**, ele precisa entrar em **cinco** listas de `firestore.rules`, e não
> só uma: `validCaseIds()`, `validObjectiveKeys()` (as chaves `caso:objetivo`), `isValidProgressMap()`,
> `isMonotonicMaps()` e `isValidDraftsMap()`. As regras do Firestore não têm lambdas, então cada
> função é expandida caso a caso — é por isso que a lista é repetida. Esquecer a
> `validObjectiveKeys()` faz o progresso do caso novo ser recusado; esquecer a `isMonotonicMaps()`
> deixa o progresso dele encolher sem ninguém reclamar.
>
> Os testes em `src/composables/use-drafts.spec.ts` cobrem essa divergência: eles falham se
> qualquer uma das cinco listas ficar para trás em relação a `src/data/cases.ts`.

## Placar

`/ranking` ordena todo mundo que entrou com conta por XP. O XP é o mesmo número do cabeçalho: vem
de `computeTotalXP` em `src/utils/xp.ts`, chamado tanto pelo header quanto pelo placar, para um selo
nunca discordar do outro.

Cada linha pode trazer três selos:

| Selo | Quando |
| --- | --- |
| `1º` `2º` `3º` | posição no setor |
| `SEM NENHUMA DICA` | fechou os 16 chamados sem abrir uma única dica |
| `PRIMEIRO A FECHAR A FILA` | o menor `completedAt` entre quem é do setor e fechou tudo |

**O placar não guarda XP pronto.** O documento público guarda as chaves `caseId:objectiveId` dos
objetivos resolvidos, e o XP é recalculado a partir de `CASES` na hora de renderizar. Assim, incluir
um caso novo re-resolve o placar inteiro sem migração — e um cliente não consegue inventar XP, porque
cada chave é validada contra `validCaseIds()`/`validObjectiveIds()` pelas regras.

O documento `leaderboard/{uid}` é de leitura pública e de escrita só pelo dono:

```ts
{
  displayName: "Jonas",
  solved: ["clientes-bloqueados:o1", "estoque-abaixo-minimo:o2"],
  hints: ["clientes-bloqueados:o3"],
  sector: "Partner",
  completedAt: Timestamp,
  updatedAt: Timestamp,
}
```

`displayName` é o primeiro nome do Google, com teto de 40 caracteres. `sector`, `completedAt` e
`updatedAt` são opcionais: `sector` nasce ausente e é escolhido uma vez, `completedAt` só é escrito
na transição para fila fechada, e `updatedAt` tem de ser `== request.time`.

Regras que valem a pena conhecer antes de mexer:

- `solved` e `hints` só podem **crescer** (`hasAll` contra o documento anterior).
- `updatedAt` e `completedAt` precisam ser `== request.time`, ou seja, o relógio é do servidor.
- `completedAt` é **congelado na primeira vez** (`keepsCompletion()`). Sem isso, um sync posterior
  sobrescreveria o horário original e o selo passaria para o jogador seguinte.
- `sector` é **travado depois da primeira escolha** (`keepsSector()`). Linha sem setor pode ganhá-lo,
  linha com setor só pode manter.
- `solved.size() > 0`: ninguém entra no placar antes de fechar o primeiro objetivo.

### Setores

`Partner`, `Final`, `Prime`, `Implantação` e `Outro`. A lista mora em `SECTORS`
(`src/utils/ranking.ts`) e o espelho exato está em `validSectorIds()` no `firestore.rules` — um spec
compara as duas, então adicionar um setor em um dos dois lados sem o outro quebra o `npm run test`.

O jogador escolhe uma vez, na primeira vez que abre o placar. Enquanto não escolher, a linha existe
mas não aparece em nenhum recorte, e o placar avisa quantos estão assim.

O que o setor decide: **tudo**. Os três selos são avaliados só dentro do recorte que está aberto —
trocar de setor no seletor troca o resultado dos três.

| Selo | Escopo |
| --- | --- |
| posição, `rank`, medalhas `1º` `2º` `3º` | setor aberto |
| `PRIMEIRO A FECHAR A FILA` | setor aberto — o menor `completedAt` **entre quem é do setor** |
| `SEM NENHUMA DICA` | setor aberto — mas é sobre a sua run, então é o mesmo em qualquer recorte |

Não existe selo global. Cada setor tem o seu primeiro a fechar a fila, e ao abrir um setor novo o
selo recomeça nele: quem já tinha fechado tudo antes não tem `completedAt`, então não entra na disputa
(com ver "Quem já tinha jogado antes do placar existir" abaixo).

Como o setor é travado na primeira escolha, dá para trocar de setor **uma vez só** — o resto é
consequência de o setor ser um recorte honesto, não uma brecha: escolher o setor mais vazio logo de
início rende ouro e o primeiro a fechar daquele setor.

### Devs fora do placar

Quem tem documento em `devs/{uid}` não aparece: não ocupa vaga, não empurra ninguém para baixo e não
segura o selo de primeiro a fechar. O filtro roda **antes** de ordenar — depois, o dev ocuparia
posição e levaria uma medalha que é de outra pessoa.

Nada impede o cliente de escrever nessa coleção — as regras recusam, com `allow write: if false`. Só o
console do Firebase cria. Ler é público, e isso não expõe nada a mais: o mesmo `uid` já aparece como
id de documento em `leaderboard/`.

Para colocar alguém:

1. Firebase console → **Authentication** → copiar o `uid` da pessoa;
2. Firestore → criar a coleção `devs` → documento com **id igual ao uid** e o campo
   `displayName` (só serve para o console ficar legível).

### Ver o próprio placar no dev, sem sair do `devs/`

O dev escondido em `devs/` some também no `npm run dev`, porque o dev fala com o **mesmo** Firestore
de produção. Para testar o placar com a sua linha aparecendo, use uma variável local:

```bash
# .env (não versionado)
VITE_RANKING_SHOW_STAFF=1
```

Ela só tem efeito junto com `import.meta.env.DEV`. O build de produção dobra essa condição em
`false`, o minificador remove o branch — **a variável não tem como desligar o filtro no bundle
publicado**, mesmo que alguém a cadastre por engano nas variáveis da Vercel. Sem ela, o `npm run dev`
se comporta exatamente como o jogador vê.

Com a variável ligada, o placar local mostra o dev como se ele fosse jogador: ocupa vaga, recebe selo
e o seletor de setor aparece. É um estado de teste, não uma segunda regra de negócio.

### Depois de publicar as regras: o placar nasce vazio

As regras novas não preenchem nada retroativamente. Cada jogador publica a própria linha no próximo
login, e **sem `sector`**, porque o setor é escolhido por ele na primeira vez que abre `/ranking`.

Como o seletor abre em `Partner` e ninguém tem setor ainda, o placar fica vazio logo após o deploy. A
única pista é a linha "N jogadores ainda não escolheu setor". Duas saídas:

- avisar o time para abrir `/ranking` uma vez e escolher o setor — é o caminho honesto, e o setor
  escolhido é o de verdade;
- semear `sector` pelo console para todo mundo já de cara — o placar enche na hora, mas **trava cada
  pessoa no setor que você escolheu por ela**. Funciona enquanto `Partner` for o setor de todo mundo
  e vira o erro do dia que alguém for de `Final`.

O progresso em si aparece sozinho; o que precisa desse toque é só o recorte por setor.

### O que o emulador já pegou

Rodar as regras de verdade não foi exercício teórico — a primeira execução emulador contra
`firestore.rules` encontrou dois furos que a leitura de fonte não via:

- **O carimbo de conclusão podia ser apagado.** O `keepsCompletion()` tratava "campo ausente na
  requisição" como "campo não mexido", mas no Firestore omitir um campo numa escrita **apaga** ele.
  Bastava um `setDoc()` sem `merge` para levar o `completedAt` embora e recarimbá-lo depois — ou
  seja, o selo de "primeiro a fechar" era roubável. Agora o `keepsCompletion()` exige que o campo
  esteja presente **e** igual ao que já estava.
- **O setor tinha o mesmo furo, por acidente.** O `keepsSector()` não tinha a guarda de ausência e
  por isso negava a escrita com um erro de avaliação — o resultado certo, pelo motivo errado. Uma
  correção futura podia "arrumar" aquilo e abrir o furo. Agora a ausência é tratada explicitamente.

O lado do cliente mudou junto: o `use-leaderboard-entry.ts` lê a linha antes de carimbar, para não
retrancar um `completedAt` que já existe. Sem isso, quem terminasse o arquivo num dispositivo e
sincronizasse em outro tomava `PERMISSION_DENIED` em **toda** escrita, e o XP dele congelava.

O cliente também passou a escrever a **união** do progresso local com o que já está no servidor, e
a nunca brigar com o setor que o servidor já tem. Sem isso, uma linha do servidor mais adiantada que
o dispositivo (outro navegador, cache limpo) deixava o jogador ** impedido de escrever qualquer
coisa** — inclusive de escolher o setor.

### O que os testes das regras não cobrem

O `src/firestore.rules.spec.ts` executa as regras contra o emulador, mas só o que dá para escrever
como cliente. Ele **não** cobre o `request.time` avançando entre duas escritas, a semântica exata de
`merge` do SDK em produção, nem o console do Firebase (que ignora as regras).

O que ele cobre é o que importava: quem escreve o quê, o que não pode ser apagado, e o `hasOnly` de
campos. Uma regra que "simplifique" o `keepsCompletion()` ou o `keepsSector()` quebra um teste, não
a produção em silêncio.

O `src/utils/leaderboard-rules.spec.ts` continua como rede de segurança de **estrutura**, e cobre
uma coisa que o emulador não alcança: ele varre as chaves que o cliente monta para **todos** os
casos e compara com a allowlist `validObjectiveKeys()` das regras, enquanto o teste de emulador usa
só um punhado de chaves fixas.

### Quem já tinha jogado antes do placar existir

O progresso antigo **entra sozinho**: cada jogador publica a própria linha no próximo login, sem
precisar de script nem de migração. XP, chamados e selos aparecem normais.

O que **não** volta é o carimbo de `completedAt`, porque esse instante nunca foi gravado — o
`hasOnlyAppFields()` das regras do `users/{uid}` não permitia nenhum campo de tempo, e não existe
log nenhum com essa data. Não dá para reconstruir quem fechou a fila primeiro antes do lançamento.

Então o carimbo é dado **só para quem fecha a fila daqui pra frente**. Quem já tinha terminado tudo
entra no quadro com XP e com o selo de sem nenhuma dica, mas sem o de primeiro a fechar. Sem essa
distinção, o selo iria para quem só logou primeiro depois do deploy — um prêmio visível, permanente
e factualmente errado.

Um backfill por script não resolve essa parte: ele até consegue escrever `solved`/`hints` de todo
mundo, mas `completedAt` continuaria sem data real. Publicar esses carimbos exigiria
`firebase-admin` com credencial de serviço, porque as regras só deixam o dono escrever a própria
linha.

### O que isso expõe

A coleção é lida por qualquer pessoa, **inclusive visitante sem conta**. O que vira público é o
primeiro nome do Google e quais objetivos cada pessoa já resolveu. É uma escolha consciente: o
progresso de um jogo de SQL é o mesmo que o placar precisa mostrar.

O que as regras **não** garantem: um jogador pode escolher *não* declarar uma dica que abriu, para
conquistar o selo de sem nenhuma dica. Pegar isso exigiria recalcular o XP no servidor a partir do
documento privado — ou seja, Cloud Functions, que este projeto não usa.

### Escala

`useRanking` lê a coleção inteira e ordena no cliente. Com a base crescendo, o certo é trocar por
`orderBy` + paginação.

## Estrutura do projeto

```text
project-yeager/
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.MD
│   └── workflows/ci.yml          # typecheck, lint, test, build e audit
├── public/
│   ├── yeagar_favicon_db_v2.svg  # ícone oficial (favicon)
│   ├── sql-wasm.wasm             # SQLite compilado para WebAssembly
│   └── sql-wasm-browser.wasm
├── src/
│   ├── components/
│   │   ├── case-page-components/     # catálogo de casos
│   │   ├── main-page-components/     # hero + como funciona
│   │   ├── ranking-page-components/  # placar, selos e escolha de setor
│   │   ├── shared-components/        # header e footer
│   │   └── solution-page-components/ # editor, schema, objetivos, carimbo, modal
│   ├── composables/
│   │   ├── use-auth.ts                # popup do Google e classificação de erros
│   │   ├── use-drafts.ts              # rascunho de consulta por caso/objetivo
│   │   ├── use-editor-prefs.ts        # preferência do editor no localStorage
│   │   ├── use-leaderboard-entry.ts   # publica o progresso e o setor em leaderboard/{uid}
│   │   ├── use-progress.ts            # XP, dicas e migração visitante → usuário
│   │   ├── use-ranking.ts             # lê e ordena o placar
│   │   ├── use-reload-guard.ts        # confirmação do navegador antes de recarregar
│   │   ├── use-sql-codemirror.ts      # instância do CodeMirror com o schema do caso
│   │   └── use-sql-engine.ts          # carrega sql.js e monta o banco do caso
│   ├── data/cases.ts             # todos os casos, objetivos e gabaritos
│   ├── types/case.ts             # contrato de Case, Objective e níveis
│   ├── utils/                    # comparação de resultados, tema e setup do editor
│   │                              # *.spec.ts: testes de regras e de comparação
│   │                              # sql-completion: colunas do escopo da frase
│   │                              # reload-guard: quando avisar antes de recarregar
│   │                              # xp: fórmula única de XP e chave de progresso
│   │                              # ranking: ordenação por setor, selos e devs fora
│   ├── views/                    # main-page, case-page, solution-page, ranking-page, 404
│   ├── firebase.ts               # inicialização do app Firebase
│   ├── router/index.ts           # rotas e recuperação de chunk quebrado
│   └── base.css                  # paleta, fontes e utilidades acessíveis
├── .env.example                  # variáveis VITE_FIREBASE_* esperadas
├── firebase.json                 # aponta firestore.rules para o deploy
├── firestore.rules               # segurança do progresso, do placar e dos devs
├── index.html
├── vite.config.ts
├── vitest.rules.config.ts       # suíte que executa o firestore.rules no emulador
├── LICENSE
├── README.md
└── DEPLOY-FIRESTORE.md      # passo a passo de publicar as regras, com rollback
```

## Scripts

| Comando              | O que faz                                                                       |
| -------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`        | servidor de desenvolvimento com HMR                                             |
| `npm run build`      | `vue-tsc -b` + build de produção em `dist/`                                     |
| `npm run preview`    | serve localmente o build de produção                                            |
| `npm run typecheck`  | checagem de tipos (`vue-tsc -b`)                                                |
| `npm run lint`       | ESLint em todo o projeto                                                        |
| `npm run lint:fix`   | ESLint corrigindo o que dá pra corrigir sozinho                                 |
| `npm run test`       | testes com vitest (comparação de resultados, autocomplete, regras do Firestore) |
| `npm run test:watch` | vitest em modo watch                                                            |
| `npm run test:rules` | executa o `firestore.rules` no emulador do Firestore (precisa de Java)          |
| `npm run check`      | o combo: typecheck + lint + test + build                                        |
| `npm run rules:deploy`   | guarda uma cópia das regras e publica no Firestore                             |
| `npm run rules:rollback` | restaura a última cópia (ou a de um commit) e republica                        |
| `npm run rules:backup`   | guarda uma cópia datada das regras em `~/.yeager-rules/`                        |
| `npm run rules:list`     | lista as cópias guardadas                                                       |

## Integração contínua

O workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) roda em todo push e pull
request para `main`, com jobs concurrentes cancelados quando chega uma execução mais nova:

1. `npm ci` (com cache de dependências)
2. `npm run typecheck` — com variáveis `VITE_FIREBASE_*` de exemplo, só para o compilador
3. `npm run lint`
4. `npm run test`
5. `npm run build`
6. `npm audit --omit=dev` — vulnerabilidades em dependências de produção derrubam o PR
7. upload do `dist/` como artifact (7 dias)

## FAQ

**Preciso instalar banco de dados?**
Não. O SQLite vem como WebAssembly em `public/sql-wasm.wasm` e cada caso cria o banco em memória.

**Os dados são reais?**
São fictícios, mas o _vocabulário_ é real: nomes de tabela, coluna e o esquema seguem a convenção
do sistema de produção, para o treino bater com o dia a dia.

**Preciso criar conta?**
Não. Dá para jogar inteiro como visitante. O login com Google existe para guardar o progresso
(1450 XP) entre máquinas e para te colocar no placar.

**Posso escrever a consulta como eu quiser?**
Pode. A validação compara o conjunto de linhas devolvido com o gabarito: aliases diferentes, ordem
de linhas e de colunas, `10` no lugar de `'10'`, acento e caixa diferentes e `AVG`/`COUNT` sem
arredondar não reprovam. O que importa é trazer a mesma resposta. Quando não bate, o carimbo diz o
que não conferiu — quantas linhas, quantas colunas ou valores divergentes — sem entregar a query.

**Meu rascunho some se eu fechar a aba?**
Como visitante, não: fica no `localStorage`, gravado a cada tecla. Com login, vai para o Firestore e
volta em qualquer máquina. O rascunho é por caso **e** por objetivo, então trabalhar no o3 não apaga
o que você escreveu no o1. O navegador pode pedir confirmação ao fechar ou dar F5, mas é o aviso
padrão dele, em cima de trabalho ainda não conferido — o texto em si nunca se perde.

**Posso usar `true` numa coluna `BOOLEAN`?**
Pode. No SQLite não existe tipo booleano de verdade — a coluna é `NUMERIC` e o valor volta como `1`
ou `0` no resultado, mas no `WHERE` tanto `= true` quanto `= 1` funcionam.

**Errei a consulta, tomei alguma penalidade?**
Não. Só o uso da dica desconta XP. Erro de sintaxe devolve a mensagem do SQLite para você corrigir.

**Como adiciono um caso novo?**
Adicione o objeto em `src/data/cases.ts` (nível, contexto, `setupSQL`, objetivos com `refSQL`
testado), registre o `id` em `validCaseIds()` no `firestore.rules` e rode `npm run check`.

## Contribuindo

O Yeager é aberto a Issues e Pull Requests. O [template de PR](./.github/PULL_REQUEST_TEMPLATE.MD)
pede um resumo, o tipo de mudança e o checklist de testes.

Antes de abrir o PR:

1. Rode `npm run check` — typecheck, lint, testes e build precisam passar.
2. Se mexeu em casos, valide o `refSQL` de cada objetivo novo rodando-o contra o `setupSQL`.
3. Se adicionou um caso, atualize `validCaseIds()` em `firestore.rules` (o teste cobra isso).
4. Mantenha o estilo do projeto: TypeScript estrito, `<script setup>`, nomes em português no
   código e nos textos de interface.

Contribuições bem-vindas: novos níveis, casos mais difíceis, ajustes de acessibilidade e
traduções. Dúvidas? Abra uma Issue — pode demorar um pouco, mas respondemos.

## Créditos

- **JJ Informática** — pelo desenvolvimento do Yeager.

## Licença

Distribuído sob a licença [MIT](./LICENSE) — use, estude e contribua livremente.

```text
MIT License

Copyright (c) 2026 JJ Informática
```

<div align="center">
  <img src="./public/yeagar_favicon_db_v2.svg" width="48" alt="Yeager" />
  <p><strong>YEAGER.<span style="color:#e8a33d">.</span></strong> — os registros têm o que esconder.</p>
</div>
