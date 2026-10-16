import type { Case } from "../../types/case";

export const caso009: Case = {
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
        "Some o total vendido por vendedor, em cada filial." +
        " O relatorio deve conter na ordem o código da filial, nome do vendedor e o total vendido.",
      hint: "SUM com GROUP BY por filial e vendedor já dá o total de cada um.",
      refSQL:
        "SELECT Filial__Codigo, Vendedor__Codigo, SUM(Total_Final) AS total FROM Movimento WHERE Efetivado = 1 GROUP BY Filial__Codigo, Vendedor__Codigo;",
    },
    {
      id: "o2",
      xp: 35,
      question:
        "Classifique os vendedores dentro de cada filial pelo total vendido, do maior para o menor. " +
        "Traga a filial, nome (do vendedor), o total vendido e a posição, nessa ordem.",
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
        "Traga as colunas filial, Nome (do vendedor) e o total vendido, nessa ordem.",
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
};
