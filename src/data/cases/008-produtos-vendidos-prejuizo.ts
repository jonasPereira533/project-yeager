import type { Case } from "../../types/case";

export const caso008: Case = {
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
        "Liste as linhas de venda em que o valor unitário ficou abaixo do custo do produto. " +
        "Venda exatamente pelo custo não conta como prejuízo. Traga as colunas Sequencia, Nome (do produto), valor unitario e custo.",
      hint: "Compare Valor_Unit com Custo1 usando < depois do JOIN.",
      refSQL:
        "SELECT mp.Sequencia, p.Nome, mp.Valor_Unit, p.Custo1 FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Custo1;",
    },
    {
      id: "o2",
      xp: 30,
      question:
        "Para essas mesmas linhas, calcule o prejuízo de cada uma." +
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
};
