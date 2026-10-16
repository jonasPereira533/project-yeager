import type { Case } from "../../types/case";

export const caso004: Case = {
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
};
