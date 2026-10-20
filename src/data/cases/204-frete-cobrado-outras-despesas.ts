import type { Case } from "../../types/case";

export const caso204: Case = {
    id: "frete-cobrado-outras-despesas",
    caseNumber: "204",
    title: "Frete Cobrado como Outras Despesas",
    level: "Intermediário",
    category: "Suporte Técnico — Fiscal",
    tables: "Movimento, Movimento_Produto",
    context:
        "Um cliente quer cobrar o frete sem destacá-lo no campo próprio da nota: o valor deve sair como outras despesas (Valor_Outro) e o tipo de frete do movimento deve ficar como Sem Frete (9). Do jeito que o movimento foi lançado, a nota é rejeitada com a 535 (\"Total do Frete difere do somatório dos itens\"). O chamado trouxe só o número do movimento de saída, 8421, da Filial 1. Os tipos de frete são: 0 = Emitente, 1 = Destinatário, 2 = Terceiros e 9 = Sem Frete.",
    setupSQL: `
    CREATE TABLE Movimento (
      Ide TEXT PRIMARY KEY,
      Filial__Codigo INTEGER,
      Sequencia INTEGER,
      Tipo TEXT,
      Frete_Tipo INTEGER
    );
    INSERT INTO Movimento VALUES
      ('MOV-F01',1,8421,'S',1),
      ('MOV-F02',2,8421,'S',1),
      ('MOV-F03',1,8422,'S',0),
      ('MOV-F04',1,8423,'S',9);

    CREATE TABLE Movimento_Produto (
      Ide TEXT PRIMARY KEY,
      Movimento__Ide TEXT,
      Sequencia INTEGER,
      Valor_Frete REAL,
      Valor_Outro REAL
    );
    INSERT INTO Movimento_Produto VALUES
      ('IT-F01','MOV-F01',1,12.00,0.00),
      ('IT-F02','MOV-F01',2,8.50,0.00),
      ('IT-F03','MOV-F01',3,0.00,0.00),
      ('IT-F04','MOV-F02',1,20.00,0.00),
      ('IT-F05','MOV-F02',2,15.00,0.00),
      ('IT-F06','MOV-F03',1,9.00,0.00),
      ('IT-F07','MOV-F04',1,0.00,3.00);
  `,
    objectives: [
        {
            id: "o1",
            xp: 15,
            kind: "select",
            question:
                "Liste os itens do movimento de saída nº 8421 da Filial 1, mostrando sequencia, valor de frete e outras despesas de cada item.",
            hint: "Os itens ficam em Movimento_Produto e só guardam o Ide do movimento. Junte com Movimento para filtrar por Filial__Codigo e Sequencia.",
            refSQL: `SELECT mp.Sequencia, mp.Valor_Frete, mp.Valor_Outro
               FROM Movimento_Produto mp
               JOIN Movimento m ON m.Ide = mp.Movimento__Ide
               WHERE m.Filial__Codigo = 1 AND m.Sequencia = 8421;`,
        },
        {
            id: "o2",
            xp: 30,
            kind: "update",
            question:
                "Copie o valor do frete de cada item desse movimento (nº 8421, Filial 1) para o campo Valor_Outro. Não altere nenhuma outra coluna nem nenhum outro movimento.",
            hint: "O UPDATE não aceita JOIN no SQLite: descubra o Ide do movimento com uma subconsulta no WHERE. O número 8421 existe em mais de uma filial. E só copie: se zerar o frete antes, o valor se perde.",
            refSQL: `UPDATE Movimento_Produto
               SET Valor_Outro = Valor_Frete
               WHERE Movimento__Ide = (
                 SELECT Ide FROM Movimento
                 WHERE Filial__Codigo = 1 AND Sequencia = 8421
               );`,
            verifySQL: `SELECT Ide, Valor_Frete, Valor_Outro
                  FROM Movimento_Produto ORDER BY Ide;`,
        },
        {
            id: "o3",
            xp: 40,
            kind: "update",
            question:
                "Agora que o valor está em Valor_Outro, finalize o ajuste zere o valor do frete de todos os itens desse movimento (nº 8421, Filial 1) e altere o tipo de frete do movimento para 9 (Sem Frete).",
            hint: "Rode um UPDATE em Movimento_Produto (SET Valor_Frete = 0) e outro em Movimento (SET Frete_Tipo = 9), separados por ponto e vírgula. Os dois filtram pela Filial 1 e pela Sequencia 8421.",
            refSQL: `UPDATE Movimento SET Frete_Tipo = 9
               WHERE Filial__Codigo = 1 AND Sequencia = 8421;
               UPDATE Movimento_Produto SET Valor_Frete = 0
               WHERE Movimento__Ide = (
                 SELECT Ide FROM Movimento
                 WHERE Filial__Codigo = 1 AND Sequencia = 8421
               );`,
            verifySQL: `SELECT m.Ide AS movimento, m.Frete_Tipo, mp.Ide AS item,
                         mp.Valor_Frete, mp.Valor_Outro
                  FROM Movimento m
                  LEFT JOIN Movimento_Produto mp ON mp.Movimento__Ide = m.Ide
                  ORDER BY m.Ide, mp.Ide;`,
        },
    ],
};