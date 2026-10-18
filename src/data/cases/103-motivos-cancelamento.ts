import type { Case } from "../../types/case";

export const caso103: Case = {
  id: "motivos-cancelamento",
  caseNumber: "103",
  title: "Motivos de Cancelamento Bagunçados",
  level: "Iniciante",
  category: "Suporte Técnico — Configuração",
  tables: "MotivoCancelamento",
  context:
    "O setor fiscal encontrou motivos de cancelamento duplicados aparecendo na tela de frente de caixa, o que confunde os operadores na hora de cancelar um item. É preciso mapear o que está ativo e o que já deveria ter sido desativado.",
  setupSQL: `
      CREATE TABLE MotivoCancelamento (
        Codigo INTEGER PRIMARY KEY,
        Nome TEXT,
        Tipo INTEGER,
        Inativo BOOLEAN
      );
      INSERT INTO MotivoCancelamento VALUES
        (1,'Produto em Falta',1,0),
        (2,'Cliente Desistiu',2,0),
        (3,'Erro de Digitação',1,0), 
        (4,'Erro de Digitação (Duplicado)',1,1),
        (5,'Troco Incorreto',2,1),
        (6,'Preço Divergente',1,0),
        (7,'Sistema Travou',2,0),
        (8,'Teste Interno',1,1);
    `,
  objectives: [
    {
      id: "o1",
      xp: 10,
      question:
        "Liste o nome e o tipo dos motivos que ainda estão ativos, em ordem alfabética pelo nome. " +
        "Essa consulta deve retornar as colunas nome e tipo",
      hint: "Filtre pelos inativos = 0 e use ORDER BY pra organizar alfabeticamente.",
      refSQL:
        "SELECT Nome, Tipo FROM MotivoCancelamento WHERE Inativo = 0 ORDER BY Nome;",
    },
    {
      id: "o2",
      xp: 15,
      question:
        "Encontre os motivos cujo nome contém a palavra 'Erro'. Retorne a consulta com" +
        " as colunas Codigo, Nome e Inativo.",
      hint: "LIKE '%texto%' encontra um trecho em qualquer posição do campo.",
      refSQL:
        "SELECT Codigo, Nome, Inativo FROM MotivoCancelamento WHERE Nome LIKE '%Erro%';",
    },
    {
      id: "o3",
      xp: 20,
      question:
        "Conte quantos motivos inativos existem em cada Tipo. " +
        "O cliente deseja saber apenas o Tipo e a quantidade de motivos de cancelamentos.",
      hint: "Agrupe por Tipo depois de filtrar só os inativos.",
      refSQL:
        "SELECT Tipo, COUNT(*) AS total FROM MotivoCancelamento WHERE Inativo = 1 GROUP BY Tipo;",
    },
  ],
};
