import type { Case } from "../../types/case";

export const caso013: Case = {
  id: "caixa-travado-funcionario-inativo",
  caseNumber: "013",
  title: "Caixa que Não Fecha por Funcionário Inativo",
  level: "Avançado",
  category: "Suporte Técnico — Caixa/RH",
  tables: "Financeiro_Caixa_Mov, Funcionario",
  context:
    "Um caixa não estava fechando porque o sistema pedia a senha do funcionário que abriu — só que esse funcionário foi desligado e está inativo (Inativo = 1). O suporte quer saber quais caixas estão nessa situação e se existe algum funcionário ativo (Inativo = 0) vinculado ao mesmo caixa padrão do funcionário desligado que poderia ajudar a destravar.",
  setupSQL: `
    CREATE TABLE Funcionario (Codigo INTEGER PRIMARY KEY, Nome TEXT, Inativo INTEGER, Caixa_Padrao INTEGER);
    INSERT INTO Funcionario VALUES
      (50,'Jonas Ribeiro Alves',1,1),
      (51,'Patrícia Souza Lima',0,1),
      (52,'Eduardo Martins Braga',0,2),
      (53,'Camila Rezende Alves',1,2),
      (54,'Tiago Nascimento Rocha',0,3),
      (55,'Sabrina Costa Lemos',0,1),
      (56,'Roberto Diniz Prado',1,4);

    CREATE TABLE Financeiro_Caixa_Mov (
      Ide TEXT PRIMARY KEY, Filial INTEGER, Caixa INTEGER, Abertura TEXT, Fechamento TEXT, Abertura_Usuario INTEGER
    );
    INSERT INTO Financeiro_Caixa_Mov VALUES
      ('FCM-1',1,1,'2024-07-01 08:00',NULL,50),
      ('FCM-2',1,2,'2024-07-01 08:10','2024-07-01 18:00',52),
      ('FCM-3',1,3,'2024-07-02 09:00',NULL,53),
      ('FCM-4',2,1,'2024-07-01 09:00','2024-07-01 19:00',50),
      ('FCM-5',1,2,'2024-07-03 08:05',NULL,55),
      ('FCM-6',2,4,'2024-07-02 10:00',NULL,56);
  `,
  objectives: [
    {
      id: "o1",
      xp: 30,
      question:
        "Liste os registros de caixa abertos (Fechamento vazio) cujo funcionário de abertura está inativo. Traga as colunas Ide, Caixa e Nome do funcionário.",
      hint: "Junte Financeiro_Caixa_Mov com Funcionario pelo usuário de abertura; filtre por Fechamento nulo e funcionário inativo.",
      refSQL: `SELECT f.Ide, f.Caixa, fu.Nome
               FROM Financeiro_Caixa_Mov f JOIN Funcionario fu ON fu.Codigo = f.Abertura_Usuario
               WHERE f.Fechamento IS NULL AND fu.Inativo = 1;`,
    },
    {
      id: "o2",
      xp: 45,
      question:
        "Chame de caixa travado o registro aberto (sem fechamento) cujo funcionário de abertura está inativo. Para cada um, encontre os funcionários ativos que tenham o mesmo caixa padrão do funcionário que abriu, como possíveis substitutos. Traga as colunas Ide do registro (chame de caixa_travado) e Nome do substituto (chame de substituto_possivel), nessa ordem. Caixas sem nenhum substituto não precisam aparecer.",
      hint: "Um segundo JOIN com Funcionario (com outro apelido) comparando o Caixa_Padrao encontra colegas ativos vinculados ao mesmo caixa padrão.",
      refSQL: `SELECT f.Ide AS caixa_travado, fu_ativo.Nome AS substituto_possivel
               FROM Financeiro_Caixa_Mov f
               JOIN Funcionario fu_inativo ON fu_inativo.Codigo = f.Abertura_Usuario
               JOIN Funcionario fu_ativo ON fu_ativo.Caixa_Padrao = fu_inativo.Caixa_Padrao AND fu_ativo.Inativo = 0
               WHERE f.Fechamento IS NULL AND fu_inativo.Inativo = 1;`,
    },
    {
      id: "o3",
      xp: 60,
      question:
        "Para cada caixa travado (mesma definição do objetivo anterior), conte quantos substitutos possíveis existem, incluindo os que não têm nenhum (contagem 0). Traga as colunas Ide do registro (chame de caixa_travado) e a quantidade de substitutos (chame de substitutos), nessa ordem.",
      hint: "Se usar INNER JOIN, o caixa sem substituto some do resultado. Pense em qual tipo de junção mantém todas as linhas da esquerda mesmo sem correspondência, e conte uma coluna do funcionário ativo (não o COUNT(*)).",
      refSQL: `SELECT f.Ide AS caixa_travado, COUNT(fu_ativo.Codigo) AS substitutos
               FROM Financeiro_Caixa_Mov f
               JOIN Funcionario fu_inativo ON fu_inativo.Codigo = f.Abertura_Usuario
               LEFT JOIN Funcionario fu_ativo
                 ON fu_ativo.Caixa_Padrao = fu_inativo.Caixa_Padrao AND fu_ativo.Inativo = 0
               WHERE f.Fechamento IS NULL AND fu_inativo.Inativo = 1
               GROUP BY f.Ide;`,
    },
  ],
};
