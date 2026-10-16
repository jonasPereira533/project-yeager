import type { Case } from "../../types/case";

export const caso001: Case = {
  id: "clientes-bloqueados",
  caseNumber: "001",
      title: "Clientes Bloqueados no Cadastro",
      level: "Iniciante",
      category: "Suporte Técnico — Cadastro",
      tables: "Cli_For",
      context:
          "Um atendente relatou que alguns clientes não conseguem fechar venda nem emitir nota fiscal, mesmo com o cadastro completo. A suspeita é de cadastros marcados como bloqueados por engano ou pendência financeira ainda não resolvida.",
      setupSQL: `
      CREATE TABLE Cli_For (
        Codigo INTEGER PRIMARY KEY,
        Nome TEXT,
        Cidade TEXT,
        UF TEXT,
        Bloqueado BOOLEAN,
        Inativo BOOLEAN
      );
      INSERT INTO Cli_For VALUES
        (1,'Marisa Andrade Souza','São Paulo','SP',1,0),
        (2,'Eduardo Lima Ferreira','Campinas','SP',0,0),
        (3,'Patricia Gomes Rocha','Curitiba','PR',1,0),
        (4,'Vinícius Tavares Melo','São Paulo','SP',0,0),
        (5,'Renata Cardoso Dias','Belo Horizonte','MG',1,0),
        (6,'Felipe Nogueira Castro','Curitiba','PR',0,0),
        (7,'Camila Duarte Pires','São Paulo','SP',1,0),
        (8,'Bruno Salles Farias','Campinas','SP',0,1),
        (9,'Aline Barros Teixeira','Curitiba','PR',1,0),
        (10,'Rodrigo Prado Vieira','Belo Horizonte','MG',0,0);
    `,
      objectives: [
        {
          id: "o1",
          xp: 10,
          question: "Liste nome, cidade e UF de todos os clientes bloqueados.",
          hint: "Use WHERE pra filtrar por um campo booleano. Vale tanto Bloqueado = 1 quanto Bloqueado = true.",
          refSQL: "SELECT Nome, Cidade, UF FROM Cli_For WHERE Bloqueado = 1;",
        },
        {
          id: "o2",
          xp: 15,
          question:
              "Entre os clientes bloqueados, liste apenas os do estado de São Paulo ('SP'). Traga somente as colunas Nome e Cidade, nessa ordem.",
          hint: "Combine duas condições com AND: uma pro bloqueio, outra pro estado.",
          refSQL:
              "SELECT Nome, Cidade FROM Cli_For WHERE Bloqueado = 1 AND UF = 'SP';",
        },
        {
          id: "o3",
          xp: 20,
          question:
              "Conte quantos clientes bloqueados existem em cada UF, retornando UF e quantidade, com o estado que tem mais bloqueios primeiro.",
          hint: "Agrupe por UF e use COUNT(*); ORDER BY pra ver o estado com mais bloqueios primeiro.",
          refSQL:
              "SELECT UF, COUNT(*) AS total FROM Cli_For WHERE Bloqueado = 1 GROUP BY UF ORDER BY total DESC;",
        },
      ],
    };
