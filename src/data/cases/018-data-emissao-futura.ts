import type { Case } from "../../types/case";

export const caso018: Case = {
    id: "data-emissao-futura",
    caseNumber: "018",
    title: "Notas com Data de Emissão no Futuro",
    level: "Intermediário",
    category: "Suporte Técnico — Fiscal",
    tables: "Movimento, Movimento_NFe",
    context:
        "O fiscal encontrou notas com data de emissão posterior à data de hoje, causadas por uma estação com o relógio adiantado. Considere hoje como 15/10/2026 (2026-10-15). As notas que ainda não foram autorizadas podem ter a data corrigida para a data do movimento. As notas já autorizadas (Status 'Autorizada') não podem ser alteradas e precisam ser sinalizadas para o fiscal revisar.",
    setupSQL: `
    CREATE TABLE Movimento (
      Ide TEXT PRIMARY KEY,
      Filial__Codigo INTEGER,
      Sequencia INTEGER,
      Tipo TEXT,
      Data TEXT
    );
    INSERT INTO Movimento VALUES
      ('MOV-D01',1,9101,'S','2026-10-02 10:15:00'),
      ('MOV-D02',1,9102,'S','2026-10-05 14:40:00'),
      ('MOV-D03',1,9103,'S','2026-10-08 09:05:00'),
      ('MOV-D04',2,9104,'S','2026-10-10 16:20:00'),
      ('MOV-D05',1,9105,'S','2026-10-14 08:30:00'),
      ('MOV-D06',1,9106,'S','2026-10-12 11:00:00'),
      ('MOV-D07',2,9107,'S','2026-10-14 17:45:00'),
      ('MOV-D08',1,9108,'S','2026-09-30 13:10:00');

    CREATE TABLE Movimento_NFe (
      Movimento__Ide TEXT PRIMARY KEY,
      Data_Emissao TEXT,
      Status TEXT,
      Observacao TEXT
    );
    INSERT INTO Movimento_NFe VALUES
      ('MOV-D01','2026-11-02 10:15:00','Pendente',NULL),
      ('MOV-D02','2026-10-25 14:40:00','Rejeitada',NULL),
      ('MOV-D03','2026-10-28 09:05:00','Autorizada',NULL),
      ('MOV-D04','2026-12-10 16:20:00','Autorizada',NULL),
      ('MOV-D05','2026-10-15 08:30:00','Pendente',NULL),
      ('MOV-D06','2026-10-12 11:00:00','Pendente',NULL),
      ('MOV-D07','2026-10-16 17:45:00','Pendente',NULL),
      ('MOV-D08','2026-09-30 13:10:00','Autorizada',NULL);
  `,
    objectives: [
        {
            id: "o1",
            xp: 15,
            kind: "select",
            question:
                "Considerando hoje como 2026-10-15, liste as notas cuja data de emissão (Data_Emissao) é posterior a hoje. Notas emitidas durante o dia de hoje não contam. Traga as colunas Sequencia (do movimento), Data_Emissao e Status.",
            hint: "Data_Emissao guarda data e hora: use date(Data_Emissao) para comparar só o dia. Comparar o texto inteiro conta as notas de hoje por causa da hora.",
            refSQL: `SELECT m.Sequencia, n.Data_Emissao, n.Status
               FROM Movimento_NFe n
               JOIN Movimento m ON m.Ide = n.Movimento__Ide
               WHERE date(n.Data_Emissao) > '2026-10-15';`,
        },
        {
            id: "o2",
            xp: 30,
            kind: "update",
            question:
                "Corrija a data de emissão das notas com data posterior a hoje que ainda não foram autorizadas (Status diferente de 'Autorizada'), igualando-a à data do movimento (coluna Data da tabela Movimento). Não altere notas autorizadas, nem notas com data de hoje ou anterior.",
            hint: "O valor novo vem de outra tabela: use uma subconsulta no SET, como SET Data_Emissao = (SELECT Data FROM Movimento WHERE Ide = Movimento_NFe.Movimento__Ide).",
            refSQL: `UPDATE Movimento_NFe
               SET Data_Emissao = (
                 SELECT m.Data FROM Movimento m
                 WHERE m.Ide = Movimento_NFe.Movimento__Ide
               )
               WHERE date(Data_Emissao) > '2026-10-15'
                 AND Status <> 'Autorizada';`,
            verifySQL: `SELECT Movimento__Ide, Data_Emissao, Status, Observacao
                  FROM Movimento_NFe ORDER BY Movimento__Ide;`,
        },
        {
            id: "o3",
            xp: 40,
            kind: "update",
            question:
                "As notas já autorizadas com data de emissão posterior a hoje não podem ter a data alterada. Sinalize-as para o fiscal revisar, gravando o texto 'REVISAR DATA DE EMISSAO' na coluna Observacao. Não altere mais nada.",
            hint: "UPDATE Movimento_NFe SET Observacao = '...' com WHERE para a data futura (use date()) e para o Status 'Autorizada'.",
            refSQL: `UPDATE Movimento_NFe
               SET Observacao = 'REVISAR DATA DE EMISSAO'
               WHERE date(Data_Emissao) > '2026-10-15'
                 AND Status = 'Autorizada';`,
            verifySQL: `SELECT Movimento__Ide, Data_Emissao, Status, Observacao
                  FROM Movimento_NFe ORDER BY Movimento__Ide;`,
        },
    ],
};