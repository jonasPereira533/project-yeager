import type { Case } from "../types/case";

/**
 * Casos gerados a partir das tabelas reais do banco etrade2.sql (sistema de
 * gestão para varejo/restaurante/posto — módulos de vendas, estoque,
 * financeiro, fiscal e permissões). Os nomes de tabela e coluna seguem a
 * convenção real do sistema (PascalCase, chaves estrangeiras com "__",
 * ex: Cli_For__Codigo) — isso é proposital: quem resolver esses casos
 * pratica exatamente o vocabulário que vai encontrar no banco de produção.
 *
 * Todos os dados de clientes, funcionários e valores são fictícios.
 * Os esquemas foram simplificados (poucas colunas por tabela) a partir das
 * tabelas reais, que no sistema original têm dezenas de colunas cada.
 *
 * Cada refSQL foi validada rodando de fato contra o setupSQL correspondente
 * antes de entrar neste arquivo.
 */

// ============================================================
// NÍVEL BÁSICO — uma tabela, WHERE, ORDER BY, GROUP BY simples
// ============================================================

const CASES_BASICO: Case[] = [
  {
    id: "clientes-bloqueados",
    caseNumber: "060",
    title: "Clientes Bloqueados no Cadastro",
    level: "Iniciante",
    category: "Suporte Técnico — Cadastro",
    tables: "Cli_For",
    context:
      "Um atendente relatou que alguns clientes não conseguem fechar venda nem emitir nota fiscal, mesmo com o cadastro completo. A suspeita é de cadastros marcados como bloqueados por engano ou pendência financeira ainda não resolvida.",
    setupSQL: `
      CREATE TABLE Cli_For (
        Codigo INTEGER PRIMARY KEY,
        Nome TEXT,
        Cidade TEXT,
        UF TEXT,
        Bloqueado INTEGER,
        Inativo INTEGER
      );
      INSERT INTO Cli_For VALUES
        (1,'Marisa Andrade Souza','São Paulo','SP',1,0),
        (2,'Eduardo Lima Ferreira','Campinas','SP',0,0),
        (3,'Patricia Gomes Rocha','Curitiba','PR',1,0),
        (4,'Vinícius Tavares Melo','São Paulo','SP',0,0),
        (5,'Renata Cardoso Dias','Belo Horizonte','MG',1,0),
        (6,'Felipe Nogueira Castro','Curitiba','PR',0,0),
        (7,'Camila Duarte Pires','São Paulo','SP',1,0),
        (8,'Bruno Salles Farias','Campinas','SP',0,1),
        (9,'Aline Barros Teixeira','Curitiba','PR',1,0),
        (10,'Rodrigo Prado Vieira','Belo Horizonte','MG',0,0);
    `,
    objectives: [
      {
        id: "o1",
        xp: 10,
        question: "Liste nome, cidade e UF de todos os clientes bloqueados.",
        hint: "Use WHERE pra filtrar por um campo do tipo booleano (0/1).",
        refSQL: "SELECT Nome, Cidade, UF FROM Cli_For WHERE Bloqueado = 1;",
      },
      {
        id: "o2",
        xp: 15,
        question:
          "Entre os bloqueados, filtre apenas os que são do estado de São Paulo ('SP').",
        hint: "Combine duas condições com AND: uma pro bloqueio, outra pro estado.",
        refSQL:
          "SELECT Nome, Cidade FROM Cli_For WHERE Bloqueado = 1 AND UF = 'SP';",
      },
      {
        id: "o3",
        xp: 20,
        question:
          "Conte quantos clientes bloqueados existem por UF, do maior para o menor.",
        hint: "Agrupe por UF e use COUNT(*); ORDER BY pra ver o estado com mais bloqueios primeiro.",
        refSQL:
          "SELECT UF, COUNT(*) AS total FROM Cli_For WHERE Bloqueado = 1 GROUP BY UF ORDER BY total DESC;",
      },
    ],
  },
  {
    id: "estoque-abaixo-minimo",
    caseNumber: "061",
    title: "Produtos Abaixo do Estoque Mínimo",
    level: "Iniciante",
    category: "Suporte Técnico — Estoque",
    tables: "Estoque_Atual",
    context:
      "Uma filial reportou ruptura de produtos na gôndola sem nenhum alerta prévio do sistema. O suporte precisa levantar quais itens já estão abaixo do estoque mínimo configurado, filial por filial.",
    setupSQL: `
      CREATE TABLE Estoque_Atual (
        Filial INTEGER,
        Produto TEXT,
        Qtde REAL,
        Estoque_Minimo REAL
      );
      INSERT INTO Estoque_Atual VALUES
        (1,'P001',5,10),
        (1,'P002',20,10),
        (1,'P003',2,5),
        (1,'P004',8,8),
        (1,'P005',0,3),
        (2,'P001',12,10),
        (2,'P002',1,6),
        (2,'P003',9,4),
        (2,'P006',3,10),
        (2,'P007',15,5),
        (3,'P001',4,4),
        (3,'P002',1,2);
    `,
    objectives: [
      {
        id: "o1",
        xp: 10,
        question:
          "Liste os produtos cuja quantidade em estoque está abaixo do mínimo configurado.",
        hint: "Compare duas colunas da mesma linha na cláusula WHERE (Qtde menor que Estoque_Minimo).",
        refSQL:
          "SELECT Filial, Produto, Qtde, Estoque_Minimo FROM Estoque_Atual WHERE Qtde < Estoque_Minimo;",
      },
      {
        id: "o2",
        xp: 15,
        question: "Entre esses, filtre apenas os produtos da Filial 2.",
        hint: "Adicione mais uma condição com AND pra restringir a uma filial específica.",
        refSQL:
          "SELECT Produto, Qtde, Estoque_Minimo FROM Estoque_Atual WHERE Qtde < Estoque_Minimo AND Filial = 2;",
      },
      {
        id: "o3",
        xp: 20,
        question:
          "Conte quantos produtos estão abaixo do mínimo em cada filial, da maior pra menor.",
        hint: "Agrupe por Filial e conte quantas linhas sobram depois do filtro.",
        refSQL:
          "SELECT Filial, COUNT(*) AS total FROM Estoque_Atual WHERE Qtde < Estoque_Minimo GROUP BY Filial ORDER BY total DESC;",
      },
    ],
  },
  {
    id: "motivos-cancelamento",
    caseNumber: "062",
    title: "Motivos de Cancelamento Bagunçados",
    level: "Iniciante",
    category: "Suporte Técnico — Configuração",
    tables: "MotivoCancelamento",
    context:
      "O setor fiscal encontrou motivos de cancelamento duplicados aparecendo na tela de frente de caixa, o que confunde os operadores na hora de cancelar um item. É preciso mapear o que está ativo e o que já deveria ter sido desativado.",
    setupSQL: `
      CREATE TABLE MotivoCancelamento (
        Codigo INTEGER PRIMARY KEY,
        Nome TEXT,
        Tipo INTEGER,
        Inativo INTEGER
      );
      INSERT INTO MotivoCancelamento VALUES
        (1,'Produto em Falta',1,0),
        (2,'Cliente Desistiu',2,0),
        (3,'Erro de Digitação',1,0),
        (4,'Erro de Digitação (Duplicado)',1,1),
        (5,'Troco Incorreto',2,1),
        (6,'Preço Divergente',1,0),
        (7,'Sistema Travou',2,0),
        (8,'Teste Interno',1,1);
    `,
    objectives: [
      {
        id: "o1",
        xp: 10,
        question:
          "Liste nome e tipo dos motivos que ainda estão ativos, em ordem alfabética.",
        hint: "Filtre pelos inativos = 0 e use ORDER BY pra organizar alfabeticamente.",
        refSQL:
          "SELECT Nome, Tipo FROM MotivoCancelamento WHERE Inativo = 0 ORDER BY Nome;",
      },
      {
        id: "o2",
        xp: 15,
        question: "Encontre os motivos cujo nome contém a palavra 'Erro'.",
        hint: "LIKE '%texto%' encontra um trecho em qualquer posição do campo.",
        refSQL:
          "SELECT Codigo, Nome, Inativo FROM MotivoCancelamento WHERE Nome LIKE '%Erro%';",
      },
      {
        id: "o3",
        xp: 20,
        question: "Conte quantos motivos inativos existem por Tipo.",
        hint: "Agrupe por Tipo depois de filtrar só os inativos.",
        refSQL:
          "SELECT Tipo, COUNT(*) AS total FROM MotivoCancelamento WHERE Inativo = 1 GROUP BY Tipo;",
      },
    ],
  },
];

// ==================================================================
// NÍVEL INTERMEDIÁRIO — JOIN entre 2 tabelas, GROUP BY + HAVING
// ==================================================================

const CASES_INTERMEDIARIO: Case[] = [
  {
    id: "vendas-nao-efetivadas",
    caseNumber: "070",
    title: "Vendas que Sumiram do Fechamento",
    level: "Intermediário",
    category: "Suporte Técnico — Caixa",
    tables: "Movimento, Cli_For",
    context:
      "Um operador de caixa reclamou que cobrou um cliente, mas a venda não apareceu no fechamento do dia. O suporte suspeita de vendas que ficaram registradas como não efetivadas no sistema.",
    setupSQL: `
      CREATE TABLE Cli_For (Codigo INTEGER PRIMARY KEY, Nome TEXT);
      INSERT INTO Cli_For VALUES
        (101,'Studio Vídeo Prime'),
        (102,'Mercadinho Bom Preço'),
        (103,'Fernanda Alves Peixoto'),
        (104,'Auto Peças Rota 12');

      CREATE TABLE Movimento (
        Filial__Codigo INTEGER,
        Sequencia INTEGER,
        Data TEXT,
        Cli_For__Codigo INTEGER,
        Caixa__Codigo INTEGER,
        Total_Final REAL,
        Efetivado INTEGER
      );
      INSERT INTO Movimento VALUES
        (1,1001,'2024-06-01 09:15',101,1,350.00,1),
        (1,1002,'2024-06-01 10:02',102,1,120.50,1),
        (1,1003,'2024-06-01 10:40',103,1,89.90,0),
        (1,1004,'2024-06-01 11:05',104,2,640.00,1),
        (1,1005,'2024-06-01 11:47',101,2,75.30,0),
        (1,1006,'2024-06-01 13:12',102,1,210.00,1),
        (2,2001,'2024-06-01 09:30',103,3,55.00,0),
        (2,2002,'2024-06-01 10:15',104,3,430.00,1),
        (2,2003,'2024-06-01 12:00',101,3,18.90,0),
        (2,2004,'2024-06-01 14:20',102,4,300.00,1);
    `,
    objectives: [
      {
        id: "o1",
        xp: 15,
        question:
          "Liste sequência, data e total das vendas que não foram efetivadas.",
        hint: "Um filtro simples em Efetivado já resolve.",
        refSQL:
          "SELECT Sequencia, Data, Total_Final FROM Movimento WHERE Efetivado = 0;",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Agora mostre o nome do cliente em cada uma dessas vendas não efetivadas.",
        hint: "Junte Movimento com Cli_For pelo código do cliente pra trazer o nome.",
        refSQL:
          "SELECT c.Nome, m.Sequencia, m.Total_Final FROM Movimento m JOIN Cli_For c ON c.Codigo = m.Cli_For__Codigo WHERE m.Efetivado = 0;",
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Encontre os caixas que tiveram mais de uma venda não efetivada.",
        hint: "Agrupe pelo caixa e use HAVING pra manter só quem apareceu mais de uma vez.",
        refSQL:
          "SELECT Caixa__Codigo, COUNT(*) AS total FROM Movimento WHERE Efetivado = 0 GROUP BY Caixa__Codigo HAVING COUNT(*) > 1;",
      },
    ],
  },
  {
    id: "itens-fora-preco-tabela",
    caseNumber: "071",
    title: "Itens Vendidos Fora do Preço de Tabela",
    level: "Intermediário",
    category: "Suporte Técnico — Vendas",
    tables: "Movimento_Produto, Produto",
    context:
      "O setor comercial percebeu que alguns itens foram vendidos com valor diferente do preço de tabela cadastrado no produto, e quer localizar exatamente quais vendas fugiram do preço oficial.",
    setupSQL: `
      CREATE TABLE Produto (Codigo TEXT PRIMARY KEY, Nome TEXT, Preco1 REAL);
      INSERT INTO Produto VALUES
        ('P001','Óleo Motor 1L',45.00),
        ('P002','Filtro de Ar',32.00),
        ('P003','Pastilha de Freio',89.00),
        ('P004','Bateria 60Ah',420.00);

      CREATE TABLE Movimento_Produto (
        Filial__Codigo INTEGER,
        Sequencia INTEGER,
        Produto__Codigo TEXT,
        Qtde REAL,
        Valor_Unit REAL
      );
      INSERT INTO Movimento_Produto VALUES
        (1,1001,'P001',2,45.00),
        (1,1002,'P002',1,28.00),
        (1,1003,'P003',1,89.00),
        (1,1004,'P002',3,30.00),
        (2,2001,'P004',1,400.00),
        (2,2002,'P001',4,45.00),
        (2,2003,'P002',2,25.00),
        (2,2004,'P003',1,95.00),
        (1,1005,'P004',1,420.00);
    `,
    objectives: [
      {
        id: "o1",
        xp: 15,
        question:
          "Liste as linhas de venda em que o valor unitário é diferente do preço de tabela do produto.",
        hint: "Junte Movimento_Produto com Produto pelo código; compare Valor_Unit com Preco1 usando <>.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, mp.Valor_Unit, p.Preco1 FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit <> p.Preco1;",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Filtre apenas os itens vendidos ABAIXO do preço de tabela, mostrando a diferença de valor.",
        hint: "Troque a comparação por < pra pegar só o que foi vendido mais barato que a tabela.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, (p.Preco1 - mp.Valor_Unit) AS diferenca FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Preco1;",
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Entre os vendidos abaixo do preço, encontre os produtos com mais de uma ocorrência, do mais frequente pro menos.",
        hint: "Agrupe pelo produto, conte as ocorrências e use HAVING > 1.",
        refSQL:
          "SELECT p.Nome, COUNT(*) AS total FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Preco1 GROUP BY p.Codigo HAVING COUNT(*) > 1 ORDER BY total DESC;",
      },
    ],
  },
  {
    id: "caixas-sem-fechamento",
    caseNumber: "072",
    title: "Caixas que Nunca Fecharam",
    level: "Intermediário",
    category: "Suporte Técnico — Financeiro",
    tables: "Financeiro_Caixa_Mov, Caixas",
    context:
      "O financeiro identificou registros de caixa que aparentemente nunca foram fechados no sistema, o que trava o relatório de conferência diária. É preciso localizar esses registros e o caixa responsável.",
    setupSQL: `
      CREATE TABLE Caixas (Codigo INTEGER PRIMARY KEY, Nome TEXT);
      INSERT INTO Caixas VALUES (1,'Caixa Loja - Frente'), (2,'Caixa Delivery'), (3,'Caixa Gerência');

      CREATE TABLE Financeiro_Caixa_Mov (
        Filial INTEGER,
        Caixa INTEGER,
        Abertura TEXT,
        Fechamento TEXT
      );
      INSERT INTO Financeiro_Caixa_Mov VALUES
        (1,1,'2024-06-01 08:00','2024-06-01 18:00'),
        (1,1,'2024-06-02 08:05',NULL),
        (1,2,'2024-06-01 08:10','2024-06-01 17:50'),
        (1,2,'2024-06-02 08:15',NULL),
        (2,1,'2024-06-01 09:00','2024-06-01 19:00'),
        (2,3,'2024-06-01 09:05',NULL),
        (2,1,'2024-06-02 09:10',NULL),
        (1,3,'2024-06-01 08:20','2024-06-01 18:10');
    `,
    objectives: [
      {
        id: "o1",
        xp: 15,
        question:
          "Liste filial, caixa e horário de abertura dos registros que nunca foram fechados.",
        hint: "Fechamento vazio significa que o caixa nunca foi fechado — use IS NULL.",
        refSQL:
          "SELECT Filial, Caixa, Abertura FROM Financeiro_Caixa_Mov WHERE Fechamento IS NULL;",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Mostre o nome do caixa (não só o código) para os registros sem fechamento da Filial 1.",
        hint: "Junte com Caixas pra pegar o nome, e adicione o filtro de filial.",
        refSQL:
          "SELECT c.Nome, f.Abertura FROM Financeiro_Caixa_Mov f JOIN Caixas c ON c.Codigo = f.Caixa WHERE f.Fechamento IS NULL AND f.Filial = 1;",
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Encontre os caixas (pelo nome) que ficaram sem fechamento mais de uma vez, considerando todas as filiais.",
        hint: "Agrupe pelo caixa (não pelo nome, pra evitar duplicar por acento) e use HAVING.",
        refSQL:
          "SELECT c.Nome, COUNT(*) AS total FROM Financeiro_Caixa_Mov f JOIN Caixas c ON c.Codigo = f.Caixa WHERE f.Fechamento IS NULL GROUP BY c.Codigo HAVING COUNT(*) > 1;",
      },
    ],
  },
];

// ============================================================================
// NÍVEL AVANÇADO — CTEs, subconsultas correlacionadas, window functions
// ============================================================================

const CASES_AVANCADO: Case[] = [
  {
    id: "compradores-unicos-alto-valor",
    caseNumber: "080",
    title: "Clientes de Compra Única Acima da Média",
    level: "Avançado",
    category: "Suporte Técnico — Marketing/Vendas",
    tables: "Movimento, Cli_For",
    context:
      "O time de marketing quer montar uma campanha de reativação e pediu uma lista de clientes que compraram só uma vez — mas somente os que valem a pena priorizar: aqueles cuja compra foi mais alta que o ticket médio dos clientes recorrentes.",
    setupSQL: `
      CREATE TABLE Cli_For (Codigo INTEGER PRIMARY KEY, Nome TEXT);
      INSERT INTO Cli_For VALUES
        (201,'Ana Beatriz Rocha'), (202,'Comércio Silva & Filhos'), (203,'Marcos Vinícius Prado'),
        (204,'Padaria Trigo Dourado'), (205,'Juliana Ferreira Nunes'), (206,'Distribuidora Norte Sul');

      CREATE TABLE Movimento (
        Filial__Codigo INTEGER, Sequencia INTEGER, Cli_For__Codigo INTEGER,
        Data TEXT, Total_Final REAL, Efetivado INTEGER
      );
      INSERT INTO Movimento VALUES
        (1,1,201,'2024-01-10',150.00,1),
        (1,2,202,'2024-02-05',300.00,1),
        (1,3,202,'2024-03-11',280.00,1),
        (1,4,203,'2024-01-20',900.00,1),
        (1,5,204,'2024-02-15',210.00,1),
        (1,6,204,'2024-04-02',195.00,1),
        (1,7,204,'2024-05-19',230.00,1),
        (1,8,205,'2024-03-01',95.00,1),
        (1,9,206,'2024-02-20',150.00,0),
        (1,10,203,'2024-06-01',50.00,0);
    `,
    objectives: [
      {
        id: "o1",
        xp: 20,
        question:
          "Liste nome e valor da compra dos clientes que fizeram exatamente 1 compra efetivada.",
        hint: "Agrupe por cliente e use HAVING COUNT(*) = 1 pra achar quem comprou uma única vez.",
        refSQL: `SELECT cf.Nome, MAX(m.Total_Final) AS total
                 FROM Movimento m JOIN Cli_For cf ON cf.Codigo = m.Cli_For__Codigo
                 WHERE m.Efetivado = 1
                 GROUP BY m.Cli_For__Codigo
                 HAVING COUNT(*) = 1;`,
      },
      {
        id: "o2",
        xp: 30,
        question:
          "Calcule o valor médio das compras feitas por clientes recorrentes (2 ou mais compras efetivadas).",
        hint: "Primeiro identifique quem tem 2+ compras (uma CTE ajuda), depois calcule a média dessas compras.",
        refSQL: `WITH compras AS (
                   SELECT Cli_For__Codigo, Total_Final FROM Movimento WHERE Efetivado = 1
                 ),
                 contagem AS (
                   SELECT Cli_For__Codigo, COUNT(*) AS qtde FROM compras GROUP BY Cli_For__Codigo
                 )
                 SELECT AVG(c.Total_Final) AS media_recorrentes
                 FROM compras c JOIN contagem ct ON ct.Cli_For__Codigo = c.Cli_For__Codigo
                 WHERE ct.qtde >= 2;`,
      },
      {
        id: "o3",
        xp: 40,
        question:
          "Agora junte as duas análises: mostre os clientes de compra única cujo valor superou a média calculada no objetivo anterior.",
        hint: "Uma consulta com WITH ajuda a organizar: primeiro quem comprou uma vez, depois a média dos recorrentes, por fim comparar as duas coisas.",
        refSQL: `WITH compras AS (
                   SELECT Cli_For__Codigo, Total_Final FROM Movimento WHERE Efetivado = 1
                 ),
                 contagem AS (
                   SELECT Cli_For__Codigo, COUNT(*) AS qtde_compras FROM compras GROUP BY Cli_For__Codigo
                 ),
                 media_recorrentes AS (
                   SELECT AVG(c.Total_Final) AS media
                   FROM compras c JOIN contagem ct ON ct.Cli_For__Codigo = c.Cli_For__Codigo
                   WHERE ct.qtde_compras >= 2
                 )
                 SELECT cf.Nome, c.Total_Final
                 FROM compras c
                 JOIN contagem ct ON ct.Cli_For__Codigo = c.Cli_For__Codigo
                 JOIN Cli_For cf ON cf.Codigo = c.Cli_For__Codigo
                 WHERE ct.qtde_compras = 1
                   AND c.Total_Final > (SELECT media FROM media_recorrentes);`,
      },
    ],
  },
  {
    id: "produtos-vendidos-prejuizo",
    caseNumber: "081",
    title: "Produtos Vendidos com Prejuízo",
    level: "Avançado",
    category: "Suporte Técnico — Financeiro/Fiscal",
    tables: "Movimento_Produto, Produto",
    context:
      "A contabilidade encontrou vendas registradas com prejuízo (preço abaixo do custo) durante a conferência mensal e quer entender quais produtos concentram esse problema — só os que fogem do padrão, não qualquer prejuízo pontual.",
    setupSQL: `
      CREATE TABLE Produto (Codigo TEXT PRIMARY KEY, Nome TEXT, Custo1 REAL);
      INSERT INTO Produto VALUES
        ('P001','Óleo Motor 1L',38.00), ('P002','Filtro de Ar',22.00),
        ('P003','Pastilha de Freio',60.00), ('P004','Bateria 60Ah',350.00);

      CREATE TABLE Movimento_Produto (
        Filial__Codigo INTEGER, Sequencia INTEGER, Produto__Codigo TEXT, Qtde REAL, Valor_Unit REAL
      );
      INSERT INTO Movimento_Produto VALUES
        (1,1,'P001',2,45.00),
        (1,2,'P002',3,20.00),
        (1,3,'P002',1,18.00),
        (1,4,'P003',1,60.00),
        (2,1,'P004',1,340.00),
        (2,2,'P001',5,40.00),
        (2,3,'P002',2,15.00),
        (2,4,'P004',1,355.00);
    `,
    objectives: [
      {
        id: "o1",
        xp: 20,
        question:
          "Liste as linhas de venda em que o valor unitário ficou abaixo do custo do produto.",
        hint: "Compare Valor_Unit com Custo1 usando < depois do JOIN.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, mp.Valor_Unit, p.Custo1 FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Custo1;",
      },
      {
        id: "o2",
        xp: 30,
        question:
          "Calcule o prejuízo de cada linha (diferença de preço vezes quantidade), do maior pro menor.",
        hint: "Multiplique a diferença de preço pela quantidade pra chegar no prejuízo da linha.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, (p.Custo1 - mp.Valor_Unit) * mp.Qtde AS prejuizo FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Custo1 ORDER BY prejuizo DESC;",
      },
      {
        id: "o3",
        xp: 40,
        question:
          "Some o prejuízo total por produto e mostre apenas os que ficaram acima da média de prejuízo entre os produtos afetados.",
        hint: "Some o prejuízo por produto numa CTE, depois compare cada total com a média de todos os totais usando uma subconsulta.",
        refSQL: `WITH prejuizo_linha AS (
                   SELECT mp.Produto__Codigo, (p.Custo1 - mp.Valor_Unit) * mp.Qtde AS prejuizo
                   FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo
                   WHERE mp.Valor_Unit < p.Custo1
                 ),
                 prejuizo_produto AS (
                   SELECT Produto__Codigo, SUM(prejuizo) AS total FROM prejuizo_linha GROUP BY Produto__Codigo
                 )
                 SELECT p.Nome, pp.total
                 FROM prejuizo_produto pp JOIN Produto p ON p.Codigo = pp.Produto__Codigo
                 WHERE pp.total > (SELECT AVG(total) FROM prejuizo_produto);`,
      },
    ],
  },
  {
    id: "ranking-vendedores-filial",
    caseNumber: "082",
    title: "Ranking de Vendedores por Filial",
    level: "Avançado",
    category: "Suporte Técnico — Comercial",
    tables: "Movimento, Funcionario",
    context:
      "A gerência regional pediu um ranking dos dois vendedores que mais venderam em cada filial no mês, pra decidir a distribuição de bônus. O relatório precisa considerar só vendas efetivadas.",
    setupSQL: `
      CREATE TABLE Funcionario (Codigo INTEGER PRIMARY KEY, Nome TEXT);
      INSERT INTO Funcionario VALUES
        (10,'Carlos Eduardo Matos'), (11,'Beatriz Lopes Andrade'),
        (12,'Diego Fernandes Rocha'), (13,'Larissa Mendes Costa');

      CREATE TABLE Movimento (
        Filial__Codigo INTEGER, Sequencia INTEGER, Vendedor__Codigo INTEGER,
        Total_Final REAL, Efetivado INTEGER
      );
      INSERT INTO Movimento VALUES
        (1,1,10,500.00,1),
        (1,2,10,300.00,1),
        (1,3,11,900.00,1),
        (1,4,11,200.00,0),
        (1,5,12,650.00,1),
        (1,6,13,150.00,1),
        (2,1,10,400.00,1),
        (2,2,11,700.00,1),
        (2,3,12,720.00,1),
        (2,4,12,80.00,1),
        (2,5,13,950.00,1);
    `,
    objectives: [
      {
        id: "o1",
        xp: 20,
        question:
          "Some o total vendido (efetivado) por vendedor, em cada filial.",
        hint: "SUM com GROUP BY por filial e vendedor já dá o total de cada um.",
        refSQL:
          "SELECT Filial__Codigo, Vendedor__Codigo, SUM(Total_Final) AS total FROM Movimento WHERE Efetivado = 1 GROUP BY Filial__Codigo, Vendedor__Codigo;",
      },
      {
        id: "o2",
        xp: 35,
        question:
          "Classifique os vendedores dentro de cada filial pelo total vendido (1º, 2º, 3º...), mostrando o nome de cada um.",
        hint: "RANK() OVER (PARTITION BY ... ORDER BY ... DESC) classifica dentro de cada grupo.",
        refSQL: `WITH vendas AS (
                   SELECT Filial__Codigo, Vendedor__Codigo, SUM(Total_Final) AS total
                   FROM Movimento WHERE Efetivado = 1
                   GROUP BY Filial__Codigo, Vendedor__Codigo
                 )
                 SELECT v.Filial__Codigo, f.Nome, v.total,
                        RANK() OVER (PARTITION BY v.Filial__Codigo ORDER BY v.total DESC) AS posicao
                 FROM vendas v JOIN Funcionario f ON f.Codigo = v.Vendedor__Codigo;`,
      },
      {
        id: "o3",
        xp: 45,
        question:
          "Agora filtre e mostre só os 2 primeiros colocados de cada filial.",
        hint: "Não dá pra filtrar o resultado de uma window function na mesma consulta — coloque-a numa CTE e filtre na consulta de fora.",
        refSQL: `WITH vendas AS (
                   SELECT Filial__Codigo, Vendedor__Codigo, SUM(Total_Final) AS total
                   FROM Movimento WHERE Efetivado = 1
                   GROUP BY Filial__Codigo, Vendedor__Codigo
                 ),
                 ranking AS (
                   SELECT Filial__Codigo, Vendedor__Codigo, total,
                          RANK() OVER (PARTITION BY Filial__Codigo ORDER BY total DESC) AS posicao
                   FROM vendas
                 )
                 SELECT r.Filial__Codigo, f.Nome, r.total
                 FROM ranking r JOIN Funcionario f ON f.Codigo = r.Vendedor__Codigo
                 WHERE r.posicao <= 2;`,
      },
    ],
  },
];

export const CASES: Case[] = [
  ...CASES_BASICO,
  ...CASES_INTERMEDIARIO,
  ...CASES_AVANCADO,
];
