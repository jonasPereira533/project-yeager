import type { Case } from "../../types/case";

export const caso007: Case = {
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
              "Agora junte as duas análises e mostre os clientes de compra única cujo valor superou a média do objetivo anterior. " +
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
};