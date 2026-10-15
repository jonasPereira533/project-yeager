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
    caseNumber: "001",
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
        Bloqueado BOOLEAN,
        Inativo BOOLEAN
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
        hint: "Use WHERE pra filtrar por um campo booleano. Vale tanto Bloqueado = 1 quanto Bloqueado = true.",
        refSQL: "SELECT Nome, Cidade, UF FROM Cli_For WHERE Bloqueado = 1;",
      },
      {
        id: "o2",
        xp: 15,
        question:
            "Entre os clientes bloqueados, liste apenas os do estado de São Paulo ('SP'). Traga somente as colunas Nome e Cidade, nessa ordem.",
        hint: "Combine duas condições com AND: uma pro bloqueio, outra pro estado.",
        refSQL:
          "SELECT Nome, Cidade FROM Cli_For WHERE Bloqueado = 1 AND UF = 'SP';",
      },
      {
        id: "o3",
        xp: 20,
        question:
            "Conte quantos clientes bloqueados existem em cada UF. Traga duas colunas: a UF e a quantidade, com o estado que tem mais bloqueios primeiro.",
        hint: "Agrupe por UF e use COUNT(*); ORDER BY pra ver o estado com mais bloqueios primeiro.",
        refSQL:
          "SELECT UF, COUNT(*) AS total FROM Cli_For WHERE Bloqueado = 1 GROUP BY UF ORDER BY total DESC;",
      },
    ],
  },
  {
    id: "estoque-abaixo-minimo",
    caseNumber: "002",
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
          "Liste os produtos cuja quantidade em estoque (Qtde) está abaixo do mínimo configurado (Estoque_Minimo). " +
            "Essa consulta deve conter colunas Filial, Produto, Qtde e Estoque_Minimo.",
        hint: "Compare duas colunas da mesma linha na cláusula WHERE (Qtde menor que Estoque_Minimo).",
        refSQL:
          "SELECT Filial, Produto, Qtde, Estoque_Minimo FROM Estoque_Atual WHERE Qtde < Estoque_Minimo;",
      },
      {
        id: "o2",
        xp: 15,
        question: "EEntre os produtos abaixo do mínimo, liste apenas os da Filial 2." +
            " Traga somente as colunas Produto, Qtde e Estoque_Minimo,.",
        hint: "Adicione mais uma condição com AND pra restringir a uma filial específica.",
        refSQL:
          "SELECT Produto, Qtde, Estoque_Minimo FROM Estoque_Atual WHERE Qtde < Estoque_Minimo AND Filial = 2;",
      },
      {
        id: "o3",
        xp: 20,
        question:
          "Conte quantos produtos estão abaixo do mínimo em cada filial. Traga duas colunas:" +
            " a Filial e a quantidade de produtos, com a filial que tem mais produtos abaixo do mínimo primeiro.",
        hint: "Agrupe por Filial e conte quantas linhas sobram depois do filtro.",
        refSQL:
          "SELECT Filial, COUNT(*) AS total FROM Estoque_Atual WHERE Qtde < Estoque_Minimo GROUP BY Filial ORDER BY total DESC;",
      },
    ],
  },
  {
    id: "motivos-cancelamento",
    caseNumber: "003",
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
        Inativo BOOLEAN
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
          "Liste o nome e o tipo dos motivos que ainda estão ativos, em ordem alfabética pelo nome." +
            "Essa consulta deve retornar as colunas nome e tipo",
        hint: "Filtre pelos inativos = 0 e use ORDER BY pra organizar alfabeticamente.",
        refSQL:
          "SELECT Nome, Tipo FROM MotivoCancelamento WHERE Inativo = 0 ORDER BY Nome;",
      },
      {
        id: "o2",
        xp: 15,
        question: "Encontre os motivos cujo nome contém a palavra 'Erro'. retorne a consulta com" +
            " as colunas Codigo, Nome e Inativo.",
        hint: "LIKE '%texto%' encontra um trecho em qualquer posição do campo.",
        refSQL:
          "SELECT Codigo, Nome, Inativo FROM MotivoCancelamento WHERE Nome LIKE '%Erro%';",
      },
      {
        id: "o3",
        xp: 20,
        question: "Conte quantos motivos inativos existem em cada Tipo. " +
            "O cliente deseja saber apenas o Tipo e a quantidade de motivos de cancelamentos.",
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
    caseNumber: "004",
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
        Efetivado BOOLEAN
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
          "Liste a sequência, a data e o total das vendas que não foram efetivadas.",
        hint: "Um filtro simples em Efetivado já resolve.",
        refSQL:
          "SELECT Sequencia, Data, Total_Final FROM Movimento WHERE Efetivado = 0;",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Para essas mesmas vendas não efetivadas, mostre o nome do cliente a sequencia e o total de cada compra",
        hint: "Junte Movimento com Cli_For pelo código do cliente pra trazer o nome.",
        refSQL:
          "SELECT c.Nome, m.Sequencia, m.Total_Final FROM Movimento m JOIN Cli_For c ON c.Codigo = m.Cli_For__Codigo WHERE m.Efetivado = 0;",
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Descubra quais caixas tiveram mais de uma venda não efetivada. " +
            "O cliente deseja visualizar apenas o caixa e a quantidade de vendas não efetivada",
        hint: "Agrupe pelo caixa e use HAVING pra manter só quem apareceu mais de uma vez.",
        refSQL:
          "SELECT Caixa__Codigo, COUNT(*) AS total FROM Movimento WHERE Efetivado = 0 GROUP BY Caixa__Codigo HAVING COUNT(*) > 1;",
      },
    ],
  },
  {
    id: "itens-fora-preco-tabela",
    caseNumber: "005",
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
          "Liste as linhas de venda em que o valor unitário vendido é diferente do preço de tabela do produto (Preco1)." +
            " Traga as colunas Sequencia, Nome (do produto), Valor_Unit e Preco1, nessa ordem.",
        hint: "Junte Movimento_Produto com Produto pelo código; compare Valor_Unit com Preco1 usando <>.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, mp.Valor_Unit, p.Preco1 FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit <> p.Preco1;",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Entre essas vendas, considere apenas os itens vendidos ABAIXO do preço de tabela e mostre quanto foi dado de" +
            " desconto em cada um (preço de tabela menos valor vendido). Traga as colunas Sequencia, Nome (do produto) e a diferença.",
        hint: "Troque a comparação por < pra pegar só o que foi vendido mais barato que a tabela.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, (p.Preco1 - mp.Valor_Unit) AS diferenca FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Preco1;",
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Entre os itens vendidos abaixo do preço de tabela, descubra quais produtos aparecem mais de uma vez. " +
            "Traga duas colunas: o Nome do produto e a quantidade de vendas abaixo do preço, com o produto mais frequente primeiro.",
        hint: "Agrupe pelo produto, conte as ocorrências e use HAVING > 1.",
        refSQL:
          "SELECT p.Nome, COUNT(*) AS total FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Preco1 GROUP BY p.Codigo HAVING COUNT(*) > 1 ORDER BY total DESC;",
      },
    ],
  },
  {
    id: "caixas-sem-fechamento",
    caseNumber: "006",
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
          "Mostre o nome do caixa (não só o código) e a abertura para os registros sem fechamento da Filial 1.",
        hint: "Junte com Caixas pra pegar o nome, e adicione o filtro de filial.",
        refSQL:
          "SELECT c.Nome, f.Abertura FROM Financeiro_Caixa_Mov f JOIN Caixas c ON c.Codigo = f.Caixa WHERE f.Fechamento IS NULL AND f.Filial = 1;",
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Considerando todas as filiais, descubra quais caixas ficaram sem fechamento mais de uma vez." +
            " Traga duas colunas: o Nome do caixa e a quantidade de registros sem fechamento.",
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
    caseNumber: "007",
    title: "Clientes de Compra Única Acima da Média",
    level: "Avançado",
    category: "Suporte Técnico — Marketing/Vendas",
    tables: "Movimento, Cli_For",
    context:
      "O time de marketing quer montar uma campanha de reativação e pediu uma lista de clientes que compraram só uma vez " +
        " mas somente os que valem a pena priorizar: aqueles cuja compra foi mais alta que o ticket médio dos clientes recorrentes. ",
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
        hint: "Primeiro identifique quem tem 2+ compras (uma CTE ajuda), depois calcule a média dessas compras. Retorne apenas o cliente e o valor total",
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
          "Agora junte as duas análises: Mostre os clientes de compra única cujo valor superou a média do objetivo anterior. " +
            "Traga as colunas Nome e o valor da compra, nessa ordem.",
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
    caseNumber: "008",
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
          "Liste as linhas de venda em que o valor unitário ficou abaixo do custo do produto (Custo1). " +
            "Venda exatamente pelo custo não conta como prejuízo. Traga as colunas Sequencia, Nome (do produto), valor unitario e custo, nessa ordem.",
        hint: "Compare Valor_Unit com Custo1 usando < depois do JOIN.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, mp.Valor_Unit, p.Custo1 FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Custo1;",
      },
      {
        id: "o2",
        xp: 30,
        question:
          "Para essas mesmas linhas, calcule o prejuízo de cada uma: (custo − valor unitário) × quantidade." +
            " Traga as colunas Sequencia, Nome (do produto) e o prejuízo, ordenadas do maior prejuízo para o menor.",
        hint: "Multiplique a diferença de preço pela quantidade pra chegar no prejuízo da linha.",
        refSQL:
          "SELECT mp.Sequencia, p.Nome, (p.Custo1 - mp.Valor_Unit) * mp.Qtde AS prejuizo FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Custo1 ORDER BY prejuizo DESC;",
      },
      {
        id: "o3",
        xp: 40,
        question:
          "Some o prejuízo de cada produto e calcule a média desses totais por produto." +
            " Mostre apenas os produtos cujo total ficou acima dessa média. Traga as colunas Nome (do produto) e o prejuízo total.",
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
    caseNumber: "009",
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
        Total_Final REAL, Efetivado BOOLEAN
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
          "Some o total vendido (efetivado) por vendedor, em cada filial." +
            " O relatorio deve conter na ordem o código da filial, nome do vendedor e o total vendido.",
        hint: "SUM com GROUP BY por filial e vendedor já dá o total de cada um.",
        refSQL:
          "SELECT Filial__Codigo, Vendedor__Codigo, SUM(Total_Final) AS total FROM Movimento WHERE Efetivado = 1 GROUP BY Filial__Codigo, Vendedor__Codigo;",
      },
      {
        id: "o2",
        xp: 35,
        question:
          "Classifique os vendedores dentro de cada filial pelo total vendido, do maior para o menor: 1º, 2º, 3º... " +
            "Traga as colunas Filial__Codigo, Nome (do vendedor), o total vendido e a posição, nessa ordem.",
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
          "Mostre apenas os 2 primeiros colocados de cada filial (pelo total vendido). " +
            "Traga as colunas Filial__Codigo, Nome (do vendedor) e o total vendido, nessa ordem.",
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

  {
    id: "icms-desonerado-devolucao",
    caseNumber: "010",
    title: "ICMS Desonerado Preso em Nota de Devolução",
    level: "Avançado",
    category: "Suporte Técnico — Fiscal",
    tables: "Movimento, Movimento_Produto, Filial",
    context:
        "Uma nota de devolução foi rejeitada pela SEFAZ por causa do ICMS Desonerado. Isso costuma acontecer quando a filial é Simples Nacional, mas o XML importado veio de um fornecedor Regime Normal que destaca esse campo — e ele acaba herdado na devolução. Antes de ajustar qualquer coisa no banco, é preciso mapear exatamente quais linhas estão com esse problema. Nos dados, Tipo 'D' é devolução e 'S' é saída; MotDesICMS igual a '0' significa que a linha não tem ICMS Desonerado.",
    setupSQL: `
      CREATE TABLE Filial (Codigo INTEGER PRIMARY KEY, Nome TEXT, RegimeTributario TEXT);
      INSERT INTO Filial VALUES
                           (1,'Matriz Centro','Simples Nacional'),
                           (2,'Filial Zona Sul','Regime Normal');

      CREATE TABLE Movimento (
                               Ide TEXT PRIMARY KEY, Filial__Codigo INTEGER, Sequencia INTEGER, Tipo TEXT
      );
      INSERT INTO Movimento VALUES
                              ('MOV-A1',1,5001,'D'),
                              ('MOV-A2',1,5002,'S'),
                              ('MOV-A3',2,6001,'D'),
                              ('MOV-A4',1,5003,'D'),
                              ('MOV-A5',1,5004,'D');

      CREATE TABLE Movimento_Produto (
                                       Movimento__Ide TEXT, Linha INTEGER, Produto__Codigo TEXT, MotDesICMS TEXT, MotDesIcmsSt TEXT
      );
      INSERT INTO Movimento_Produto VALUES
                                      ('MOV-A1',1,'P001','10','10'),
                                      ('MOV-A1',2,'P002','0','0'),
                                      ('MOV-A2',1,'P001','10','10'),
                                      ('MOV-A3',1,'P003','10','10'),
                                      ('MOV-A4',1,'P002','20','20'),
                                      ('MOV-A4',2,'P004','30','10'),
                                      ('MOV-A5',1,'P001','0','0');
    `,
    objectives: [
      {
        id: "o1",
        xp: 30,
        question:
            "Liste as linhas de produto de devoluções (Tipo = 'D') que têm ICMS Desonerado, ou seja, MotDesICMS diferente de '0'. Traga as colunas Movimento__Ide e Linha, nessa ordem.",
        hint: "Junte Movimento_Produto com Movimento pelo Ide, e filtre por Tipo = 'D' e MotDesICMS diferente de '0'.",
        refSQL: `SELECT mp.Movimento__Ide, mp.Linha
                 FROM Movimento_Produto mp JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                 WHERE m.Tipo = 'D' AND mp.MotDesICMS <> '0';`,
      },
      {
        id: "o2",
        xp: 45,
        question:
            "Do resultado anterior, mantenha apenas as devoluções cuja filial é Simples Nacional (RegimeTributario = 'Simples Nacional'), porque só nelas o campo é um problema. Traga as colunas Movimento__Ide e Linha, nessa ordem.",
        hint: "Adicione mais um JOIN com Filial e filtre pelo regime tributário.",
        refSQL: `SELECT mp.Movimento__Ide, mp.Linha
                 FROM Movimento_Produto mp
                        JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                        JOIN Filial fi ON fi.Codigo = m.Filial__Codigo
                 WHERE m.Tipo = 'D' AND mp.MotDesICMS <> '0' AND fi.RegimeTributario = 'Simples Nacional';`,
      },
      {
        id: "o3",
        xp: 60,
        question:
            "Considere como linha afetada a que atende ao critério do objetivo anterior (devolução, filial Simples Nacional e MotDesICMS diferente de '0'). Descubra quais notas têm mais de uma linha afetada, pois essas são prioridade para o ajuste. Traga as colunas Ide, Sequencia e a quantidade de linhas afetadas (chame de total), nessa ordem.",
        hint: "Agrupe pelo Ide do movimento e use HAVING pra achar quem tem mais de uma linha afetada.",
        refSQL: `SELECT m.Ide, m.Sequencia, COUNT(*) AS total
                 FROM Movimento_Produto mp
                        JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                        JOIN Filial fi ON fi.Codigo = m.Filial__Codigo
                 WHERE m.Tipo = 'D' AND mp.MotDesICMS <> '0' AND fi.RegimeTributario = 'Simples Nacional'
                 GROUP BY m.Ide
                 HAVING COUNT(*) > 1;`,
      },
    ],
  },


  {
    id: "valor-final-divergente-ipi",
    caseNumber: "011",
    title: "Valor Final Divergente após Zerar o IPI",
    level: "Avançado",
    category: "Suporte Técnico — Financeiro/Fiscal",
    tables: "Movimento, Movimento_Produto",
    context:
      "Depois de zerar o IPI de uma saída já efetivada, o valor total da nota ficou divergente do esperado — porque o campo Valor_final é a soma de vários componentes, incluindo o IPI, e não se recalcula sozinho. Antes de rodar o ajuste, é preciso confirmar exatamente quais linhas estão desatualizadas. E o primeiro passo é mais básico do que parece: conferir se o próprio Valor_total ainda fecha com Qtde × Valor_Unit, porque pelo menos uma linha teve esse campo mexido à mão e ficou fora da conta.",
    setupSQL: `
      CREATE TABLE Movimento (Ide TEXT PRIMARY KEY, Sequencia INTEGER);
      INSERT INTO Movimento VALUES ('MOV-B1',7001), ('MOV-B2',7002), ('MOV-B3',7003);
 
      CREATE TABLE Movimento_Produto (
        Movimento__Ide TEXT, Linha INTEGER, Qtde REAL, Valor_Unit REAL, Desc_Valor REAL,
        Valor_promocao REAL, vICMSDeson REAL, vfcpst REAL, Valor_Frete REAL, Valor_Seguro REAL,
        Valor_Outro REAL, Valor_IPI REAL, Comissao REAL, Valor_ICMS_ST REAL,
        Valor_total REAL, Valor_final REAL
      );
      INSERT INTO Movimento_Produto VALUES
        ('MOV-B1',1,2,50.00,5.00,0,0,0,0,0,0,8.00,2.00,3.00,100.00,108.00),
        ('MOV-B1',2,1,200.00,0,10.00,0,0,0,0,0,0.00,5.00,0,200.00,210.00),
        ('MOV-B1',3,3,15.00,1.00,0,2.00,0,0,0,0,1.50,0.50,0,45.00,44.00),
        ('MOV-B2',1,4,25.00,2.00,0,0,1.00,3.00,0,0,4.00,1.00,0.50,100.00,107.50),
        ('MOV-B2',2,2,80.00,0,5.00,0,0,0,0,0,0.00,3.00,0,160.00,163.00),
        ('MOV-B2',3,1,500.00,0,0,0,0,0,0,0,45.00,10.00,5.00,495.00,560.00),
        ('MOV-B3',1,6,12.00,3.00,0,0,0.50,0,0,0,0.00,1.00,0,72.00,82.50),
        ('MOV-B3',2,2,90.00,0,0,0,0,2.00,0,0,6.00,0,0,180.00,188.00);
    `,
    objectives: [
      {
        id: "o1",
        xp: 30,
        question:
          "Antes de recalcular qualquer coisa, encontre as linhas em que o campo Valor_total não bate com Qtde × Valor_Unit (compare com 2 casas decimais). " +
            "Traga as colunas Movimento__Ide e Linha, nessa ordem.",
        hint: "Compare Valor_total com Qtde * Valor_Unit e devolva só as linhas que divergem. Um ROUND(...,2) nos dois lados evita diferença por causa de casa decimal.",
        refSQL: `SELECT mp.Movimento__Ide, mp.Linha
                 FROM Movimento_Produto mp
                 WHERE ROUND(mp.Valor_total,2) <> ROUND(mp.Qtde * mp.Valor_Unit, 2);`,
      },
      {
        id: "o2",
        xp: 45,
        question:
          "o2: \"Recalcule o Valor_final de cada linha pela fórmula abaixo e liste as linhas em que o valor armazenado diverge do calculado (compare com 2 casas decimais): " +
            "Qtde × Valor_Unit − Desc_Valor − Valor_promocao − vICMSDeson + vfcpst + Valor_Frete + Valor_Seguro + Valor_Outro + Valor_IPI + Comissao + Valor_ICMS_ST. Use Qtde × Valor_Unit como base, e não o campo Valor_total. " +
            "Traga as colunas Sequencia (do movimento), Linha, o valor armazenado (chame de armazenado) e o valor calculado (chame de calculado), nessa ordem.\"\n",
        hint: "Escreva a fórmula numa expressão só e compare com Valor_final usando ROUND(...,2) nos dois lados. Junte com Movimento pra trazer a Sequencia.",
        refSQL: `SELECT m.Sequencia, mp.Linha, mp.Valor_final AS armazenado,
                        ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                              + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                              + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2) AS calculado
                 FROM Movimento_Produto mp JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                 WHERE ROUND(mp.Valor_final,2) <>
                       ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                             + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                             + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2);`,
      },
      {
        id: "o3",
        xp: 60,
        question:
          "Para cada nota (movimento), some a diferença (armazenado − calculado) das linhas divergentes do objetivo anterior e mostre apenas as " +
            "notas cuja soma passa de R$ 10,00. Traga as colunas Sequencia e a soma (chame de diferenca_total), nessa ordem.",
        hint: "Some a diferença (armazenado menos calculado) agrupando por movimento, e filtre com HAVING pra priorizar quem tem mais impacto.",
        refSQL: `SELECT m.Sequencia,
                        SUM(ROUND(mp.Valor_final,2) -
                            ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                                  + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                                  + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2)) AS diferenca_total
                 FROM Movimento_Produto mp JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                 WHERE ROUND(mp.Valor_final,2) <>
                       ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                             + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                             + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2)
                 GROUP BY m.Ide
                 HAVING diferenca_total > 10;`,
      },
    ],
  },
  {



    id: "vencimento-parcela-divergente",
    caseNumber: "012",
    title: "Vencimento de Parcela Fora do Padrão",
    level: "Avançado",
    category: "Suporte Técnico — Financeiro",
    tables: "Movimento, Movimento_NFe, Movimento_Financeiro",
    context:
      "O financeiro percebeu parcelas com data de vencimento estranha. A regra é simples: o vencimento de uma parcela a pagar (Tipo = 'P') deveria ser sempre a data de emissão da nota mais 1 dia. É preciso achar as parcelas que fogem dessa regra.",
    setupSQL: `
      CREATE TABLE Movimento (Ide TEXT PRIMARY KEY, Sequencia INTEGER);
      INSERT INTO Movimento VALUES ('MOV-C1',8001), ('MOV-C2',8002), ('MOV-C3',8003);
 
      CREATE TABLE Movimento_NFe (Movimento__Ide TEXT, Data_Emissao TEXT);
      INSERT INTO Movimento_NFe VALUES ('MOV-C1','2024-05-10'), ('MOV-C2','2024-05-12'), ('MOV-C3','2024-05-15');
 
      CREATE TABLE Movimento_Financeiro (Ide TEXT PRIMARY KEY, Movimento__Ide TEXT, Tipo TEXT, Vencimento TEXT);
      INSERT INTO Movimento_Financeiro VALUES
        ('FIN-1','MOV-C1','P','2024-05-11'),
        ('FIN-2','MOV-C1','P','2024-05-20'),
        ('FIN-3','MOV-C1','R','2024-05-11'),
        ('FIN-4','MOV-C2','P','2024-05-13'),
        ('FIN-5','MOV-C2','P','2024-05-12'),
        ('FIN-6','MOV-C3','P','2024-05-16'),
        ('FIN-7','MOV-C3','P','2024-05-16'),
        ('FIN-9','MOV-C1','P','2024-05-25');
    `,
    objectives: [
      {
        id: "o1",
        xp: 30,
        question:
          "Liste as parcelas a pagar (Tipo = 'P') cujo Vencimento é diferente da data de emissão da nota mais 1 dia. Traga as colunas Ide (da parcela), Vencimento e o vencimento esperado, nessa ordem.",
        hint: "A função date(coluna, '+1 day') soma um dia a uma data em formato texto. Compare o resultado com o Vencimento armazenado.",
        refSQL: `SELECT mf.Ide, mf.Vencimento, date(nfe.Data_Emissao,'+1 day') AS vencimento_esperado
                 FROM Movimento_Financeiro mf JOIN Movimento_NFe nfe ON nfe.Movimento__Ide = mf.Movimento__Ide
                 WHERE mf.Tipo = 'P' AND mf.Vencimento <> date(nfe.Data_Emissao,'+1 day');`,
      },
      {
        id: "o2",
        xp: 45,
        question:
          "Repita a consulta anterior, trazendo também a Sequencia da nota (mais fácil de identificar do que o Ide técnico)." +
            " Traga as colunas Sequencia, Ide (da parcela), Vencimento e o vencimento esperado (chame de esperado), nessa ordem.",
        hint: "Adicione o JOIN com Movimento só pra trazer a Sequencia.",
        refSQL: `SELECT m.Sequencia, mf.Ide, mf.Vencimento, date(nfe.Data_Emissao,'+1 day') AS esperado
                 FROM Movimento_Financeiro mf
                 JOIN Movimento_NFe nfe ON nfe.Movimento__Ide = mf.Movimento__Ide
                 JOIN Movimento m ON m.Ide = mf.Movimento__Ide
                 WHERE mf.Tipo = 'P' AND mf.Vencimento <> date(nfe.Data_Emissao,'+1 day');`,
      },
      {
        id: "o3",
        xp: 60,
        question:
          "Considere parcela com vencimento errado a que atende ao critério do objetivo anterior (Tipo = 'P' e vencimento diferente da emissão mais 1 dia)." +
            " Descubra quais notas têm mais de uma parcela errada. Traga as colunas Sequencia e a quantidade de parcelas erradas (chame de total), nessa ordem.",
        hint: "Agrupe pelo Ide do movimento e use HAVING > 1 pra achar as notas com mais de uma parcela errada.",
        refSQL: `SELECT m.Sequencia, COUNT(*) AS total
                 FROM Movimento_Financeiro mf
                 JOIN Movimento_NFe nfe ON nfe.Movimento__Ide = mf.Movimento__Ide
                 JOIN Movimento m ON m.Ide = mf.Movimento__Ide
                 WHERE mf.Tipo = 'P' AND mf.Vencimento <> date(nfe.Data_Emissao,'+1 day')
                 GROUP BY m.Ide
                 HAVING COUNT(*) > 1;`,
      },
    ],
  },

  {
    id: "caixa-travado-funcionario-inativo",
    caseNumber: "013",
    title: "Caixa que Não Fecha por Funcionário Inativo",
    level: "Avançado",
    category: "Suporte Técnico — Caixa/RH",
    tables: "Financeiro_Caixa_Mov, Funcionario",
    context:
        "Um caixa não estava fechando porque o sistema pedia a senha do funcionário que abriu — só que esse funcionário foi desligado e está inativo (Inativo = 1). O suporte quer saber quais caixas estão nessa situação e se existe algum funcionário ativo (Inativo = 0) vinculado ao mesmo caixa padrão do funcionário desligado que poderia ajudar a destravar.",
    setupSQL: `
    CREATE TABLE Funcionario (Codigo INTEGER PRIMARY KEY, Nome TEXT, Inativo INTEGER, Caixa_Padrao INTEGER);
    INSERT INTO Funcionario VALUES
      (50,'Jonas Ribeiro Alves',1,1),
      (51,'Patrícia Souza Lima',0,1),
      (52,'Eduardo Martins Braga',0,2),
      (53,'Camila Rezende Alves',1,2),
      (54,'Tiago Nascimento Rocha',0,3),
      (55,'Sabrina Costa Lemos',0,1),
      (56,'Roberto Diniz Prado',1,4);

    CREATE TABLE Financeiro_Caixa_Mov (
      Ide TEXT PRIMARY KEY, Filial INTEGER, Caixa INTEGER, Abertura TEXT, Fechamento TEXT, Abertura_Usuario INTEGER
    );
    INSERT INTO Financeiro_Caixa_Mov VALUES
      ('FCM-1',1,1,'2024-07-01 08:00',NULL,50),
      ('FCM-2',1,2,'2024-07-01 08:10','2024-07-01 18:00',52),
      ('FCM-3',1,3,'2024-07-02 09:00',NULL,53),
      ('FCM-4',2,1,'2024-07-01 09:00','2024-07-01 19:00',50),
      ('FCM-5',1,2,'2024-07-03 08:05',NULL,55),
      ('FCM-6',2,4,'2024-07-02 10:00',NULL,56);
  `,
    objectives: [
      {
        id: "o1",
        xp: 30,
        question:
            "Liste os registros de caixa abertos (Fechamento vazio) cujo funcionário de abertura está inativo (Inativo = 1). Traga as colunas Ide, Caixa e Nome (do funcionário), nessa ordem.",
        hint: "Junte Financeiro_Caixa_Mov com Funcionario pelo usuário de abertura; filtre por Fechamento nulo e funcionário inativo.",
        refSQL: `SELECT f.Ide, f.Caixa, fu.Nome
               FROM Financeiro_Caixa_Mov f JOIN Funcionario fu ON fu.Codigo = f.Abertura_Usuario
               WHERE f.Fechamento IS NULL AND fu.Inativo = 1;`,
      },
      {
        id: "o2",
        xp: 45,
        question:
            "Chame de caixa travado o registro aberto (sem fechamento) cujo funcionário de abertura está inativo. Para cada um, encontre os funcionários ativos (Inativo = 0) que tenham o mesmo Caixa_Padrao do funcionário que abriu, como possíveis substitutos. Traga as colunas Ide do registro (chame de caixa_travado) e Nome do substituto (chame de substituto_possivel), nessa ordem. Caixas sem nenhum substituto não precisam aparecer.",
        hint: "Um segundo JOIN com Funcionario (com outro apelido) comparando o Caixa_Padrao encontra colegas ativos vinculados ao mesmo caixa padrão.",
        refSQL: `SELECT f.Ide AS caixa_travado, fu_ativo.Nome AS substituto_possivel
               FROM Financeiro_Caixa_Mov f
               JOIN Funcionario fu_inativo ON fu_inativo.Codigo = f.Abertura_Usuario
               JOIN Funcionario fu_ativo ON fu_ativo.Caixa_Padrao = fu_inativo.Caixa_Padrao AND fu_ativo.Inativo = 0
               WHERE f.Fechamento IS NULL AND fu_inativo.Inativo = 1;`,
      },
      {
        id: "o3",
        xp: 60,
        question:
            "Para cada caixa travado (mesma definição do objetivo anterior), conte quantos substitutos possíveis existem, incluindo os que não têm nenhum (contagem 0). Traga as colunas Ide do registro (chame de caixa_travado) e a quantidade de substitutos (chame de substitutos), nessa ordem.",
        hint: "Se usar INNER JOIN, o caixa sem substituto some do resultado. Pense em qual tipo de junção mantém todas as linhas da esquerda mesmo sem correspondência, e conte uma coluna do funcionário ativo (não o COUNT(*)).",
        refSQL: `SELECT f.Ide AS caixa_travado, COUNT(fu_ativo.Codigo) AS substitutos
               FROM Financeiro_Caixa_Mov f
               JOIN Funcionario fu_inativo ON fu_inativo.Codigo = f.Abertura_Usuario
               LEFT JOIN Funcionario fu_ativo
                 ON fu_ativo.Caixa_Padrao = fu_inativo.Caixa_Padrao AND fu_ativo.Inativo = 0
               WHERE f.Fechamento IS NULL AND fu_inativo.Inativo = 1
               GROUP BY f.Ide;`,
      },
    ],
  },



  {
    id: "bug-troco-forma-pagamento",
    caseNumber: "014",
    title: "Bug do Troco Subtraindo o Total da Forma de Pagamento",
    level: "Avançado",
    category: "Suporte Técnico — Financeiro",
    tables: "Movimento_Financeiro_Diario",
    context:
        "Um parceiro notou valores estranhos no fechamento de caixa de um dia específico, numa única forma de pagamento. Depois de comparar vários dias, foi identificado um bug em que o troco estava sendo subtraído do total da forma de pagamento em dinheiro. O primeiro passo pra confirmar isso é achar o dia fora do padrão: some os lançamentos de cada dia por forma de pagamento e compare esse total diário com a média dos totais diários daquela forma, considerando todos os dias da tabela.",
    setupSQL: `
      CREATE TABLE Movimento_Financeiro_Diario (Data TEXT, FormaPagamento TEXT, Valor REAL);
      INSERT INTO Movimento_Financeiro_Diario VALUES
                                                ('2024-06-01','Dinheiro',120), ('2024-06-01','Dinheiro',80), ('2024-06-01','Dinheiro',50),
                                                ('2024-06-02','Dinheiro',100), ('2024-06-02','Dinheiro',90), ('2024-06-02','Dinheiro',70),
                                                ('2024-06-03','Dinheiro',40), ('2024-06-03','Dinheiro',30), ('2024-06-03','Dinheiro',10),
                                                ('2024-06-04','Dinheiro',110), ('2024-06-04','Dinheiro',95), ('2024-06-04','Dinheiro',60),
                                                ('2024-06-05','Dinheiro',130), ('2024-06-05','Dinheiro',85), ('2024-06-05','Dinheiro',55),
                                                ('2024-06-01','Cartão',300), ('2024-06-01','Cartão',200),
                                                ('2024-06-02','Cartão',320), ('2024-06-02','Cartão',210),
                                                ('2024-06-03','Cartão',310), ('2024-06-03','Cartão',205),
                                                ('2024-06-04','Cartão',305), ('2024-06-04','Cartão',215),
                                                ('2024-06-05','Cartão',315), ('2024-06-05','Cartão',195);
    `,
    objectives: [
      {
        id: "o1",
        xp: 30,
        question:
            "Calcule o total recebido por dia em cada forma de pagamento. Traga as colunas Data, FormaPagamento e o total do dia (chame de total), nessa ordem.",
        hint: "Agrupe por Data e FormaPagamento e some o valor.",
        refSQL:
            "SELECT Data, FormaPagamento, SUM(Valor) AS total FROM Movimento_Financeiro_Diario GROUP BY Data, FormaPagamento;",
      },
      {
        id: "o2",
        xp: 45,
        question:
            "Ao lado do total de cada dia, mostre a média dos totais diários daquela forma de pagamento (considerando todos os dias). Atenção: a média é dos totais por dia, e não dos lançamentos individuais. Traga as colunas Data, FormaPagamento, total e a média (chame de media_forma), nessa ordem.",
        hint: "AVG(total) OVER (PARTITION BY FormaPagamento) calcula a média de cada forma sem precisar de uma segunda consulta separada. Calcule os totais diários primeiro (uma CTE ajuda).",
        refSQL: `WITH totais_dia AS (
          SELECT Data, FormaPagamento, SUM(Valor) AS total FROM Movimento_Financeiro_Diario GROUP BY Data, FormaPagamento
        )
                 SELECT Data, FormaPagamento, total, AVG(total) OVER (PARTITION BY FormaPagamento) AS media_forma
                 FROM totais_dia;`,
      },
      {
        id: "o3",
        xp: 60,
        question:
            "Encontre o dia e a forma de pagamento em que o total diário ficou abaixo de 60% da média dos totais diários daquela forma (total < média × 0,6). Esse é o indício do bug. Traga as colunas Data, FormaPagamento, total e media_forma, nessa ordem.",
        hint: "Não dá pra filtrar direto pelo resultado da window function — coloque o cálculo numa CTE e filtre na consulta de fora.",
        refSQL: `WITH totais_dia AS (
          SELECT Data, FormaPagamento, SUM(Valor) AS total FROM Movimento_Financeiro_Diario GROUP BY Data, FormaPagamento
        ),
                      com_media AS (
                        SELECT Data, FormaPagamento, total, AVG(total) OVER (PARTITION BY FormaPagamento) AS media_forma
                        FROM totais_dia
                      )
                 SELECT Data, FormaPagamento, total, media_forma FROM com_media WHERE total < media_forma * 0.6;`,
      },
    ],
  },
];

export const CASES: Case[] = [
  ...CASES_BASICO,
  ...CASES_INTERMEDIARIO,
  ...CASES_AVANCADO,
];