import type { Case } from "../../types/case";

export const caso012: Case = {
  id: "vencimento-parcela-divergente",
  caseNumber: "012",
      title: "Vencimento de Parcela Fora do Padrão",
      level: "Avançado",
      category: "Suporte Técnico — Financeiro",
      tables: "Movimento, Movimento_NFe, Movimento_Financeiro",
      context:
          "O financeiro percebeu parcelas com data de vencimento estranha. A regra é simples: o vencimento de uma parcela a pagar deveria ser sempre a data de emissão da nota mais 1 dia. É preciso achar as parcelas que fogem dessa regra.",
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
              "Repita a consulta anterior, trazendo também a Sequencia da nota." +
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
              " Descubra quais notas têm mais de uma parcela errada. Traga as colunas Sequencia e a quantidade de parcelas erradas chame de total.",
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
    };