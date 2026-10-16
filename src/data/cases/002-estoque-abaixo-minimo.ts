import type { Case } from "../../types/case";

export const caso002: Case = {
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
        "Liste os produtos cuja quantidade em estoque está abaixo do mínimo configurado. " +
        "Essa consulta deve conter colunas Filial, Produto, quantidade e estoque minimo.",
      hint: "Compare duas colunas da mesma linha na cláusula WHERE (Qtde menor que Estoque_Minimo).",
      refSQL:
        "SELECT Filial, Produto, Qtde, Estoque_Minimo FROM Estoque_Atual WHERE Qtde < Estoque_Minimo;",
    },
    {
      id: "o2",
      xp: 15,
      question:
        "Entre os produtos abaixo do mínimo, liste apenas os da Filial 2 com quantidade e estoque.",
      hint: "Adicione mais uma condição com AND pra restringir a uma filial específica.",
      refSQL:
        "SELECT Produto, Qtde, Estoque_Minimo FROM Estoque_Atual WHERE Qtde < Estoque_Minimo AND Filial = 2;",
    },
    {
      id: "o3",
      xp: 20,
      question:
        "Conte quantos produtos estão abaixo do mínimo em cada filial. Traga duas colunas" +
        " a Filial e a quantidade de produtos, com a filial que tem mais produtos abaixo do mínimo primeiro.",
      hint: "Agrupe por Filial e conte quantas linhas sobram depois do filtro.",
      refSQL:
        "SELECT Filial, COUNT(*) AS total FROM Estoque_Atual WHERE Qtde < Estoque_Minimo GROUP BY Filial ORDER BY total DESC;",
    },
  ],
};
