import type { Case } from "../../types/case";

export const caso104: Case = {
    id: "rejeicao-535-frete",
    caseNumber: "104",
    title: "Rejeição 535 no Frete da Nota",
    level: "Iniciante",
    category: "Suporte Técnico — Fiscal",
    tables: "Movimento",
    context:
        "Um cliente estava fazendo um movimento de saída e, ao informar o valor do frete e emitir a nota, o sistema devolveu a rejeição 535: \"Total do Frete difere do somatório dos itens\". O cliente quer cobrar o frete informado. O movimento do chamado tem o Ide 55887A01-3CDB-4486-985B-BBCB7FC0086F.",
    setupSQL: `
        CREATE TABLE Movimento (
                                   Ide TEXT PRIMARY KEY,
                                   Sequencia INTEGER,
                                   Tipo_Operacao TEXT,
                                   Valor_Frete REAL,
                                   Frete_Tipo INTEGER,
                                   Total_Final REAL
        );
        INSERT INTO Movimento VALUES
                                  ('55887A01-3CDB-4486-985B-BBCB7FC0086F',5531,'SAIDA',85.00,9,1240.00),
                                  ('1B7C3E52-9F4A-4D18-A6B2-0C5E8D7F1A30',5532,'SAIDA',0.00,9,310.50),
                                  ('C9D2F6A4-37E1-4B85-8A0D-6E1F2B94C7D3',5533,'SAIDA',120.00,1,2890.00),
                                  ('7E4A1D90-52BC-4F36-9D8A-3B6C0E5F8A12',5534,'SAIDA',0.00,9,75.90),
                                  ('A3F8B6E1-0D27-4C59-B1E4-9A7D5C2F6083',5535,'SAIDA',45.00,0,640.00),
                                  ('E02D9C7B-6A18-4F43-8C5E-1D3B7A9F4E65',5536,'SAIDA',0.00,9,18.90);
    `,
    objectives: [
        {
            id: "o1",
            xp: 10,
            kind: "select",
            question:
                "Consulte o movimento 55887A01-3CDB-4486-985B-BBCB7FC0086F e traga apenas o campo que precisa ser corrigido para resolver a rejeição. O resultado deve ter uma única coluna e uma única linha.",
            hint: "A rejeição acontece quando o movimento tem valor de frete, mas outro campo do frete diz que não há frete. Rode um SELECT * do movimento, compare os campos e depois escolha a coluna que está errada.",
            refSQL:
                "SELECT Frete_Tipo FROM Movimento WHERE Ide = '55887A01-3CDB-4486-985B-BBCB7FC0086F';",
        },
        {
            id: "o2",
            xp: 20,
            kind: "update",
            question:
                "Altere o campo que você encontrou no objetivo anterior para o tipo de frete '1' (Destinatário), apenas no movimento 55887A01-3CDB-4486-985B-BBCB7FC0086F. Os tipos são: 0 = Emitente, 1 = Destinatário, 2 = Terceiros e 9 = Sem Frete. Nenhum outro movimento pode ser alterado.",
            hint: "UPDATE tabela SET coluna = valor WHERE condição. Sem o WHERE, todas as linhas da tabela são alteradas.",
            refSQL:
                "UPDATE Movimento SET Frete_Tipo = 1 WHERE Ide = '55887A01-3CDB-4486-985B-BBCB7FC0086F';",
            verifySQL:
                "SELECT Ide, Sequencia, Valor_Frete, Frete_Tipo, Total_Final FROM Movimento ORDER BY Ide;",
        },
    ],
};