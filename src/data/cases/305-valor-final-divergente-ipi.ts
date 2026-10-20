import type { Case } from "../../types/case";

export const caso305: Case = {
  id: "valor-final-divergente-ipi",
  caseNumber: "305",
  title: "Valor Final Divergente após Zerar o IPI",
  level: "Avançado",
  category: "Suporte Técnico — Financeiro/Fiscal",
  tables: "Movimento, Movimento_Produto",
  context:
    "Depois de zerar o IPI de uma saída já efetivada, o valor total da nota ficou divergente do esperado — porque o campo Valor_final é a soma de vários componentes, incluindo o IPI, e não se recalcula sozinho. Antes de rodar o ajuste, é preciso confirmar exatamente quais linhas estão desatualizadas. E o primeiro passo é mais básico do que parece: conferir se o próprio Valor_total ainda fecha com Qtde × Valor_Unit, porque pelo menos uma linha teve esse campo mexido à mão e ficou fora da conta.",
  setupSQL: `
      CREATE TABLE Movimento (Ide TEXT PRIMARY KEY, Sequencia INTEGER);
      INSERT INTO Movimento VALUES ('MOV-B1',7001), ('MOV-B2',7002), ('MOV-B3',7003);
 
      CREATE TABLE Movimento_Produto (
        Movimento__Ide TEXT, Linha INTEGER, Qtde REAL, Valor_Unit REAL, Desc_Valor REAL,
        Valor_promocao REAL, vICMSDeson REAL, vfcpst REAL, Valor_Frete REAL, Valor_Seguro REAL,
        Valor_Outro REAL, Valor_IPI REAL, Comissao REAL, Valor_ICMS_ST REAL,
        Valor_total REAL, Valor_final REAL
      );
      INSERT INTO Movimento_Produto VALUES
        ('MOV-B1',1,2,50.00,5.00,0,0,0,0,0,0,8.00,2.00,3.00,100.00,108.00),
        ('MOV-B1',2,1,200.00,0,10.00,0,0,0,0,0,0.00,5.00,0,200.00,210.00),
        ('MOV-B1',3,3,15.00,1.00,0,2.00,0,0,0,0,1.50,0.50,0,45.00,44.00),
        ('MOV-B2',1,4,25.00,2.00,0,0,1.00,3.00,0,0,4.00,1.00,0.50,100.00,107.50),
        ('MOV-B2',2,2,80.00,0,5.00,0,0,0,0,0,0.00,3.00,0,160.00,163.00),
        ('MOV-B2',3,1,500.00,0,0,0,0,0,0,0,45.00,10.00,5.00,495.00,560.00),
        ('MOV-B3',1,6,12.00,3.00,0,0,0.50,0,0,0,0.00,1.00,0,72.00,82.50),
        ('MOV-B3',2,2,90.00,0,0,0,0,2.00,0,0,6.00,0,0,180.00,188.00);
    `,
  objectives: [
    {
      id: "o1",
      xp: 30,
      question:
        "Antes de recalcular qualquer coisa, encontre as linhas em que o campo Valor_total não bate com Qtde × Valor_Unit (compare com 2 casas decimais). " +
        "Traga as colunas Movimento__Ide e Linha, nessa ordem.",
      hint: "Compare Valor_total com Qtde * Valor_Unit e devolva só as linhas que divergem. Um ROUND(...,2) nos dois lados evita diferença por causa de casa decimal.",
      refSQL: `SELECT mp.Movimento__Ide, mp.Linha
                 FROM Movimento_Produto mp
                 WHERE ROUND(mp.Valor_total,2) <> ROUND(mp.Qtde * mp.Valor_Unit, 2);`,
    },
    {
      id: "o2",
      xp: 45,
      question:
        "O Valor_final de cada item deveria ser:" +
        " Qtde × Valor_Unit − Desc_Valor − Valor_promocao − vICMSDeson + vfcpst + Valor_Frete + Valor_Seguro + Valor_Outro + Valor_IPI + Comissao + Valor_ICMS_ST. " +
        "Use Qtde × Valor_Unit como base, e não o Valor_total. " +
        "Liste os itens em que o Valor_final armazenado diverge do calculado (compare com 2 casas decimais)." +
        " Traga a Sequencia da nota, o número do item (coluna Linha), o valor armazenado (chame de armazenado) e o valor calculado (chame de calculado), nessa ordem.",
      hint: "Escreva a fórmula numa expressão só e compare com Valor_final usando ROUND(...,2) nos dois lados. Junte com Movimento pra trazer a Sequencia.",
      refSQL: `SELECT m.Sequencia, mp.Linha, mp.Valor_final AS armazenado,
                        ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                              + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                              + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2) AS calculado
                 FROM Movimento_Produto mp JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                 WHERE ROUND(mp.Valor_final,2) <>
                       ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                             + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                             + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2);`,
    },
    {
      id: "o3",
      xp: 60,
      question:
        "Para cada nota (movimento), some a diferença das linhas divergentes do objetivo anterior e mostre apenas as " +
        "notas cuja soma passa de R$ 10,00. Traga as colunas Sequencia e a soma (chame de diferenca_total), nessa ordem.",
      hint: "Some a diferença (armazenado menos calculado) agrupando por movimento, e filtre com HAVING pra priorizar quem tem mais impacto.",
      refSQL: `SELECT m.Sequencia,
                        SUM(ROUND(mp.Valor_final,2) -
                            ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                                  + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                                  + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2)) AS diferenca_total
                 FROM Movimento_Produto mp JOIN Movimento m ON m.Ide = mp.Movimento__Ide
                 WHERE ROUND(mp.Valor_final,2) <>
                       ROUND(mp.Qtde*mp.Valor_Unit - mp.Desc_Valor - mp.Valor_promocao - mp.vICMSDeson
                             + mp.vfcpst + mp.Valor_Frete + mp.Valor_Seguro + mp.Valor_Outro
                             + mp.Valor_IPI + mp.Comissao + mp.Valor_ICMS_ST, 2)
                 GROUP BY m.Ide
                 HAVING diferenca_total > 10;`,
    },
  ],
};
