import type { Case } from "../../types/case";

export const caso010: Case = {
  id: "icms-desonerado-devolucao",
  caseNumber: "010",
      title: "ICMS Desonerado Preso em Nota de Devolução",
      level: "Avançado",
      category: "Suporte Técnico — Fiscal",
      tables: "Movimento, Movimento_Produto, Filial",
      context:
          "Uma nota de devolução foi rejeitada pela SEFAZ por causa do ICMS Desonerado. Isso costuma acontecer quando a " +
          "filial é Simples Nacional, mas o XML importado veio de um fornecedor Regime Normal que destaca esse campo  e ele acaba herdado na devolução. Antes de ajustar qualquer coisa no banco, é preciso mapear exatamente quais linhas estão com esse problema. Nos dados, Tipo 'D' é devolução e 'S' é saída; MotDesICMS igual a '0' significa que a linha não tem ICMS Desonerado.",
      setupSQL: `
      CREATE TABLE Filial (Codigo INTEGER PRIMARY KEY, Nome TEXT, RegimeTributario TEXT);
      INSERT INTO Filial VALUES
                           (1,'Matriz Centro','Simples Nacional'),
                           (2,'Filial Zona Sul','Regime Normal');

      CREATE TABLE Movimento (
                               Ide TEXT PRIMARY KEY, Filial__Codigo INTEGER, Sequencia INTEGER, Tipo TEXT
      );
      INSERT INTO Movimento VALUES
                              ('MOV-A1',1,5001,'D'),
                              ('MOV-A2',1,5002,'S'),
                              ('MOV-A3',2,6001,'D'),
                              ('MOV-A4',1,5003,'D'),
                              ('MOV-A5',1,5004,'D');

      CREATE TABLE Movimento_Produto (
                                       Movimento__Ide TEXT, Linha INTEGER, Produto__Codigo TEXT, MotDesICMS TEXT, MotDesIcmsSt TEXT
      );
      INSERT INTO Movimento_Produto VALUES
                                      ('MOV-A1',1,'P001','10','10'),
                                      ('MOV-A1',2,'P002','0','0'),
                                      ('MOV-A2',1,'P001','10','10'),
                                      ('MOV-A3',1,'P003','10','10'),
                                      ('MOV-A4',1,'P002','20','20'),
                                      ('MOV-A4',2,'P004','30','10'),
                                      ('MOV-A5',1,'P001','0','0');
    `,
      objectives: [
        {
          id: "o1",
          xp: 30,
          question:
              "A SEFAZ rejeitou uma devolução por causa do ICMS Desonerado. Para mapear o problema," +
              " liste os itens de notas de devolução que tem MotDesICMS diferente de '0'. Traga o identificador da" +
              " nota (Movimento__Ide) e o número do item dentro dela (coluna Linha), nessa ordem.",
          hint: "Junte Movimento_Produto com Movimento pelo Ide, e filtre por Tipo = 'D' e MotDesICMS diferente de '0'.",
          refSQL: `SELECT mp.Movimento__Ide, mp.Linha
                 FROM Movimento_Produto mp JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                 WHERE m.Tipo = 'D' AND mp.MotDesICMS <> '0';`,
        },
        {
          id: "o2",
          xp: 45,
          question:
              "Do resultado anterior, mantenha apenas as devoluções cuja filial é Simples Nacional, porque só nelas o campo é um problema. Traga as colunas Movimento__Ide e Linha.",
          hint: "Adicione mais um JOIN com Filial e filtre pelo regime tributário.",
          refSQL: `SELECT mp.Movimento__Ide, mp.Linha
                 FROM Movimento_Produto mp
                        JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                        JOIN Filial fi ON fi.Codigo = m.Filial__Codigo
                 WHERE m.Tipo = 'D' AND mp.MotDesICMS <> '0' AND fi.RegimeTributario = 'Simples Nacional';`,
        },
        {
          id: "o3",
          xp: 60,
          question:
              "As notas com mais de um item nessa situação serão ajustadas primeiro. Liste o identificador da nota (Ide), a Sequencia e a quantidade de itens afetados (chame de total), nessa ordem.",
          hint: "Agrupe pelo Ide do movimento e use HAVING pra achar quem tem mais de uma linha afetada.",
          refSQL: `SELECT m.Ide, m.Sequencia, COUNT(*) AS total
                 FROM Movimento_Produto mp
                        JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                        JOIN Filial fi ON fi.Codigo = m.Filial__Codigo
                 WHERE m.Tipo = 'D' AND mp.MotDesICMS <> '0' AND fi.RegimeTributario = 'Simples Nacional'
                 GROUP BY m.Ide
                 HAVING COUNT(*) > 1;`,
        },
      ],
};