import type { Case } from "../../types/case";

export const caso006: Case = {
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
              " Traga o nome do caixa e a quantidade de registros sem fechamento.",
          hint: "Agrupe pelo caixa (não pelo nome, pra evitar duplicar por acento) e use HAVING.",
          refSQL:
              "SELECT c.Nome, COUNT(*) AS total FROM Financeiro_Caixa_Mov f JOIN Caixas c ON c.Codigo = f.Caixa WHERE f.Fechamento IS NULL GROUP BY c.Codigo HAVING COUNT(*) > 1;",
        },
      ],
};