# Publicando as regras do Firestore — passo a passo

Documento de passagem de bastão. Quem for executar não precisa ler o código: seguir as seções na
ordem. Se algo der errado, a seção **Rollback** desfaz tudo.

**Tempo estimado:** 15 minutos.
**Risco:** baixo. A regra que protege o progresso de quem joga não muda — ver
[Por que é seguro](#por-que-é-seguro-publicar-isso).

---

## 1. O que está sendo feito

O jogo ganhou uma tela de placar em `/ranking`. Ela depende de regras novas do Firestore que ainda
**não estão no ar**. Enquanto elas não forem publicadas, nada do placar funciona:

| Coleção | O que acontece sem publicar |
| --- | --- |
| `leaderboard/{uid}` | leitura e escrita negadas — o placar fica vazio e o navegador loga `Falha ao publicar no placar` |
| `devs/{uid}` | leitura negada — a lista de devs some, o que **não** quebra nada |

As regras novas **não alteram** a coleção `users/{uid}`, que é onde fica o progresso de cada jogador.
Ou seja: publicá-las não afeta ninguém que já estava jogando.

---

## 2. O que você vai precisar

- **Acesso ao projeto no Firebase.** Use uma conta que já esteja como owner/editor do projeto. Peça
  à pessoa que te chamou se você não souber qual é.
- **Node.js** instalado (o projeto exige `^20.19.0 || >=22.12.0`).
- **Uma pasta com o código do projeto** (o mesmo repositório usado no deploy do site).

**Não é preciso:** Java, `firebase-admin`, credencial de serviço, criar índice composto, mexer em
variável de ambiente. Só a seção 6 usa o console, e ela é opcional.

---

## 3. Antes de começar: guarde uma cópia

O Firestore não tem "desfazer" para regras. A forma de voltar atrás é republicar uma versão
anterior do arquivo.

**A cópia do que está no ar não está no git.** Ela só sai do console: Firebase console → Firestore →
aba **Rules** → copiar o texto. Faça isso **antes** do primeiro deploy e guarde num arquivo:

```bash
# cole aqui o texto copiado do console
nano ~/firestore.rules.producao
```

Depois disso, cada deploy passa a guardar uma cópia datada sozinho:

```bash
npm run rules:backup     # salva em ~/.yeager-rules/
npm run rules:list       # lista as cópias
```

> **Regra de ouro: nunca publique sem ter uma cópia.** Um deploy errado sem backup pode deixar o
> jogo inteiro sem salvar progresso. Use sempre `npm run rules:deploy`, que guarda a cópia antes
> de publicar.

---

## 4. Instale elogue a CLI

```bash
npm i -g firebase-tools
firebase --version
```

Se der `command not found`, feche e abra o terminal (o `npm i -g` pode não estar no `PATH` da sua
sessão). Alternativa sem instalar nada: troque `firebase` por `npx firebase-tools` em todos os
comandos daqui pra frente.

```bash
firebase login
```

Vai abrir o navegador. Faça login com a conta que tem acesso ao projeto.

---

## 5. Publique as regras

O repositório já vem com o `firebase.json` (apontando `firestore.rules` para a raiz) e com o
`.firebaserc` (com o projeto `yeager-396bf` nos aliases `default` e `production`). **Não precisa de
`firebase init` nem de `firebase use`.**

```bash
cd /caminho/do/projeto

# 1. Confere qual arquivo de regras será usado
npx firebase deploy --only firestore:rules --dry-run
```

Espere ver `firestore.rules` na saída. Se aparecer qualquer outro arquivo, pare e avise — o
repositório pode estar com a `firebase.json` trocada.

```bash
# 2. Publica de verdade — este comando guarda uma cópia antes de publicar
npm run rules:deploy
```

Saída esperada, terminando assim:

```
✔  firestore: rules firestore.rules
✔  Deploy complete!
```

Pronto. As regras estão no ar.

> **Publicando em outro projeto?** Rode `firebase use --add` antes e escolha o projeto na lista.

---

## 6. Opcional: tirar os devs do placar

Quem escreveu o jogo não quer competir com quem joga. Isso é controlado por uma coleção chamada
`devs`, e **escrever nela pelo navegador é bloqueado pelas regras** de propósito — não dá para se
autodeclarar dev. Só quem entra no console cria.

Para cada pessoa que deve ficar fora do placar (no momento: **Juarez** e **Jonas**):

1. Abra o Firebase console e vá em **Authentication**.
2. Ache a pessoa pelo e-mail e **copie o UID** dela (clique no ícone de copiar na linha).
3. Vá em **Firestore** e crie a coleção **`devs`**.
4. Crie um documento:
   - **ID do documento:** cole o UID copiado no passo 2 (o ID *é* o UID, não invente outro nome).
   - **Campo:** `displayName`, tipo **string**, valor `Juarez`. Esse campo é só para o console ficar
     legível — o placar não usa.
5. Repita a partir do passo 2 para a outra pessoa.

Não tem como errar o ID: se colar um UID errado, a pessoa apenas **não** some do placar, e dá para
apagar o documento e criar de novo. Não há risco de esconder a pessoa errada de forma definitiva.

**Como verificar:** abra o site, entre com a conta dela e confira que a página `/ranking` mostra
"Seu progresso não entra no placar."

---

## 7. Rollback

Use se o deploy causar algum problema. **Rápido e reversível.**

```bash
cd /caminho/do/projeto

# restaura a última cópia guardada e republica
npm run rules:rollback

# ou restaura as regras de um commit específico e republica
npm run rules:rollback e06960d
```

O comando **guarda uma cópia do estado atual antes de sobrescrever**, então o rollback também é
desfeito com outro `npm run rules:rollback`.

### Qual versão usar como alvo

Só existe **um** alvo seguro no histórico do repositório. Os outros são armadilhas — todos compilam,
todos publicam sem erro, e todos quebram alguma coisa:

| Versão | Progresso do jogo | Rascunho | Placar |
| --- | --- | --- | --- |
| `cdf4da3` | ✅ | ❌ campo `draftsByCase` não existia | ❌ |
| `2c13ae6` | ❌ | ❌ | ❌ |
| `61ea78b` | ❌ | ❌ | ❌ leitura só |
| **`e06960d`** | ✅ | ✅ | ✅ |
| working tree | ✅ | ✅ | ✅ |

As três primeiras usam `data.values().all(...)` e `list.all(x, ...)`, que **não existem** na
linguagem das regras do Firestore: o arquivo compila, o `deploy` passa limpo e, na hora de
avaliar, a regra dá erro e nega a escrita. O jogo para de salvar progresso sem nenhum aviso.

`e06960d` é o commit do merge que substituiu as lambdas pelas verificações caso a caso. **Rode o
`git log --oneline -- firestore.rules` antes de escolher**, e confira o alvo com
`npm run rules:list` e com o emulador (`npm run test:rules`).

---

## 8. Como saber que funcionou

Rápido, pelo próprio navegador:

1. Rode o site (`npm run dev`, ou a URL de produção).
2. Entre com uma conta que **já tenha fechado pelo menos um objetivo**.
3. Abra o console do navegador (`F12` → aba **Console**) e recarregue a página `/ranking`.

| O que aparece | Significado |
| --- | --- |
| A página pede para escolher um setor | Funcionou. A linha foi publicada. |
| `Erro de permissão` / `Missing or insufficient permissions` | **Não** funcionou — vá para a seção 9. |
| `permission-denied` ao ler `leaderboard` | As regras novas não estão no ar. Refaça a seção 5. |
| Placar vazio e nenhum erro | Ainda não publicou nada. Feche um objetivo e recarregue. |

Pelo console do Firebase, abra a coleção `leaderboard` e confirme que existem documentos com os
campos `displayName`, `solved` e `hints`.

---

## 9. Se algo der errado

### O placar aparece, mas nada é salvo — "Missing or insufficient permissions"

Sintoma: a tela `/ranking` abre, o seletor de setor aparece, o jogador escolhe o setor e o console
mostra `Missing or insufficient permissions`. A leitura funciona, a escrita não.

A causa quase sempre é **regras desatualizadas no ar**. Uma versão antiga do `firestore.rules`
compila sem erro e libera a leitura, mas usa `list.all(x, ...)` na validação das chaves — e isso
**não existe** na linguagem das regras do Firestore. A regra compila, e na hora de avaliar dá erro e
nega a escrita. O efeito é idêntico ao de regras que não existem.

Confirme publicando de novo a partir do checkout atual:

```bash
cd /caminho/do/projeto
git status          # as regras do working tree precisam ser as novas
firebase deploy --only firestore:rules
```

E confira que o arquivo publicado é o do repositório, olhando no console do Firebase a coleção
`leaderboard`: os documentos precisam ter `displayName`, `solved`, `hints` e `updatedAt`.

### `Error: No currently active project`

O `.firebaserc` do repositório não está no lugar, ou você está num projeto diferente. Refaça:

```bash
cd /caminho/do/projeto
cat .firebaserc
firebase use --add
```

### `Error: Not in a Firebase project directory`

Você está fora da pasta do projeto, ou o `firebase.json` não está lá. Confirme:

```bash
cd /caminho/do/projeto
ls firebase.json firestore.rules .firebaserc
```

Os três precisam aparecer.

### `deploy --only firestore:rules` não encontra o arquivo

A `firebase.json` do repositório aponta para `firestore.rules` na raiz. Se você está numa cópia da
pasta, confira o conteúdo dela — tem que ser exatamente:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "firestore": {
      "host": "127.0.0.1",
      "port": 8080
    },
    "ui": {
      "enabled": false
    },
    "singleProjectMode": true
  }
}
```

### Deploy pediu confirmação sobre sobrescrever regras

Pode confirmar. É o comportamento normal ao republicar um arquivo que já existe no projeto.

### O deploy passou mas o placar continua vazio

Três causas possíveis, nessa ordem:

1. **A conta não tem progresso suficiente.** A regra exige pelo menos um objetivo fechado antes de
   publicar. Feche um e espere alguns segundos.
2. **A pessoa nunca entrou no site com essa conta desde o deploy.** A publicação acontece no
   login/entrada. Peça para a pessoa abrir o site e entrar.
3. **A pessoa é dev** e está filtrada de propósito. Confira se o UID dela está na coleção `devs`.

### O navegador reclamou de uma tela branca ao abrir `/ranking`

Isso costuma ser o aviso de "mudança de versão" do próprio projeto, não tem relação com o Firestore.
Recarregue a página.

---

## 10. Aviso importante: o placar vai aparecer vazio

Depois de publicar as regras, **o placar abre vazio**, mesmo com várias pessoas que já jogaram
bastante. Isso é esperado e tem explicação:

- O progresso de cada pessoa é publicado sozinho no próximo acesso — isso funciona sozinho.
- Mas o **setor** (Partner, Final, Prime, Implantação, Outro) é escolhido pela pessoa, uma única
  vez, na primeira vez que ela abre a tela de placar.
- Quem ainda não escolheu setor **não aparece em nenhum recorte**. O único aviso na tela é a linha
  "N jogadores ainda não escolheu setor".

**O que fazer:** avise o time para abrir a tela de placar uma vez e escolher o setor. É o caminho
honesto, porque o setor escolhido é o de verdade.

**O que NÃO fazer:** semear o setor de todo mundo pelo console para o placar encher na hora. Isso
**trava cada pessoa no setor que você escolheu por ela**, e as regras não deixam mudar depois. Como
hoje todo mundo é do mesmo setor, parece inofensivo — e vira o erro do dia que alguém de verdade for
de outro setor.

---

## 11. Antes de publicar: rode as regras localmente (opcional, mas recomendado)

As regras do placar já têm uma suíte que **executa** o `firestore.rules` contra o emulador do
Firestore. Ela exige Java:

```bash
sudo apt install -y default-jre-headless     # JRE 21 no Ubuntu 24.04
npm ci                                      # instala o firebase-tools local
npm run test:rules
```

O comando sobe um emulador local num projeto `demo-yeager` (sem credencial, sem rede, sem tocar em
produção), roda 38 testes e derruba o emulador. Se os testes passarem, a chance de o deploy te
surpreender é bem menor.

O mesmo comando roda no CI, com `actions/setup-java` fixando a versão do Java.

---

## Por que é seguro publicar isso

O blast radius é o **placar**, não o jogo. O bloco `match /users` — que protege o progresso de cada
jogador — muda entre a versão antiga e a nova, mas só na direção de **consertar**: as lambdas
(`data.values().all(...)`) foram trocadas por verificações caso a caso, porque lambdas não existem
na linguagem das regras e negavam toda escrita no progresso do jogo.

Dá para conferir o que mudou em cada bloco:

```bash
git diff e06960d HEAD -- firestore.rules
```

Na pior das hipóteses — alguma regra nova do placar estar errada e negar a escrita no
`leaderboard` — o progresso de quem joga continua salvando normalmente. O placar é que fica vazio.
Por isso o rollback da seção 7 é seguro e rápido.

## O que os testes não provam

A suíte do emulador cobre o que dá para escrever como cliente: quem escreve o quê, o que não pode
ser apagado, e o `hasOnly` de campos. Ela **não** cobre o `request.time` avançando entre duas
escritas, nem a semântica exata de `merge` do SDK em produção.

Ela também não diz o que está **publicado** — ela lê o arquivo do repositório. Publicar a partir de
um commit antigo é um erro silencioso: as regras podem compilar e ainda assim negar toda escrita do
placar (ver a seção 9). Por isso a seção 8 — testar com uma conta de verdade depois de publicar —
não é opcional.
