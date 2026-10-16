import type { Case } from "../../types/case";

export const caso014: Case = {
  id: "bug-troco-forma-pagamento",
  caseNumber: "014",
  title: "Bug do Troco Subtraindo o Total da Forma de Pagamento",
  level: "Avançado",
  category: "Suporte Técnico — Financeiro",
  tables: "Movimento_Financeiro_Diario",
  context:
    "Um parceiro notou valores estranhos no fechamento de caixa de um dia específico, numa única forma de pagamento. Depois de comparar vários dias, foi identificado um bug em que o troco estava sendo subtraído do total da forma de pagamento em dinheiro. O primeiro passo pra confirmar isso é achar o dia fora do padrão: some os lançamentos de cada dia por forma de pagamento e compare esse total diário com a média dos totais diários daquela forma, considerando todos os dias da tabela.",
  setupSQL: `
      CREATE TABLE Movimento_Financeiro_Diario (Data TEXT, FormaPagamento TEXT, Valor REAL);
      INSERT INTO Movimento_Financeiro_Diario VALUES
                                                ('2024-06-01','Dinheiro',120), ('2024-06-01','Dinheiro',80), ('2024-06-01','Dinheiro',50),
                                                ('2024-06-02','Dinheiro',100), ('2024-06-02','Dinheiro',90), ('2024-06-02','Dinheiro',70),
                                                ('2024-06-03','Dinheiro',40), ('2024-06-03','Dinheiro',30), ('2024-06-03','Dinheiro',10),
                                                ('2024-06-04','Dinheiro',110), ('2024-06-04','Dinheiro',95), ('2024-06-04','Dinheiro',60),
                                                ('2024-06-05','Dinheiro',130), ('2024-06-05','Dinheiro',85), ('2024-06-05','Dinheiro',55),
                                                ('2024-06-01','Cartão',300), ('2024-06-01','Cartão',200),
                                                ('2024-06-02','Cartão',320), ('2024-06-02','Cartão',210),
                                                ('2024-06-03','Cartão',310), ('2024-06-03','Cartão',205),
                                                ('2024-06-04','Cartão',305), ('2024-06-04','Cartão',215),
                                                ('2024-06-05','Cartão',315), ('2024-06-05','Cartão',195);
    `,
  objectives: [
    {
      id: "o1",
      xp: 30,
      question:
        "Calcule o total recebido por dia em cada forma de pagamento. Traga as colunas Data, FormaPagamento e o total do dia, chame de total.",
      hint: "Agrupe por Data e FormaPagamento e some o valor.",
      refSQL:
        "SELECT Data, FormaPagamento, SUM(Valor) AS total FROM Movimento_Financeiro_Diario GROUP BY Data, FormaPagamento;",
    },
    {
      id: "o2",
      xp: 45,
      question:
        "Ao lado do total de cada dia, mostre a média dos totais diários daquela forma de pagamento (considerando todos os dias). Atenção: a média é dos totais por dia, e não dos lançamentos individuais. Traga as colunas Data, FormaPagamento, total e a média, chame de media_forma.",
      hint: "AVG(total) OVER (PARTITION BY FormaPagamento) calcula a média de cada forma sem precisar de uma segunda consulta separada. Calcule os totais diários primeiro (uma CTE ajuda).",
      refSQL: `WITH totais_dia AS (
          SELECT Data, FormaPagamento, SUM(Valor) AS total FROM Movimento_Financeiro_Diario GROUP BY Data, FormaPagamento
        )
                 SELECT Data, FormaPagamento, total, AVG(total) OVER (PARTITION BY FormaPagamento) AS media_forma
                 FROM totais_dia;`,
    },
    {
      id: "o3",
      xp: 60,
      question:
        "Encontre o dia e a forma de pagamento em que o total diário ficou abaixo de 60% da média dos totais diários daquela forma (total < média × 0,6). Esse é o indício do bug. Traga as colunas Data, FormaPagamento, total e media_forma.",
      hint: "Não dá pra filtrar direto pelo resultado da window function — coloque o cálculo numa CTE e filtre na consulta de fora.",
      refSQL: `WITH totais_dia AS (
          SELECT Data, FormaPagamento, SUM(Valor) AS total FROM Movimento_Financeiro_Diario GROUP BY Data, FormaPagamento
        ),
                      com_media AS (
                        SELECT Data, FormaPagamento, total, AVG(total) OVER (PARTITION BY FormaPagamento) AS media_forma
                        FROM totais_dia
                      )
                 SELECT Data, FormaPagamento, total, media_forma FROM com_media WHERE total < media_forma * 0.6;`,
    },
  ],
};
