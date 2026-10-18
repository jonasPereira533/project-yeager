import type { Case } from "../../types/case";

export const caso016: Case = {
    id: "sped-icms-cst60-entrada",
    caseNumber: "016",
    title: "SPED com ICMS Indevido no CST 60",
    level: "Avançado",
    category: "Suporte Técnico — Fiscal",
    tables: "Movimento, Movimento_Produto",
    context:
        "O contador informou ao cliente irregularidades no SPED ICMS/IPI de setembro de 2026. Entre elas, itens de movimentos de entrada da Filial 1 com base, alíquota e valor de ICMS informados para o CST 60 e os CFOPs 1403 e 1910. Só valem para a correção os movimentos efetivados (Efetivado = 1 e Desefetivado = 0) cujo recebimento da nota (NotaEntradaRecebimento, que guarda data e hora) caiu em setembro de 2026.",
    setupSQL: `
    CREATE TABLE Movimento (
      Ide TEXT PRIMARY KEY,
      Filial__Codigo INTEGER,
      Sequencia INTEGER,
      Tipo TEXT,
      NotaEntradaRecebimento TEXT,
      Efetivado INTEGER,
      Desefetivado INTEGER,
      Valor_ICMS REAL,
      Base_ICMS REAL,
      vFCP REAL
    );
    INSERT INTO Movimento VALUES
      ('MOV-01',1,7101,'E','2026-09-05 10:20:00',1,0,294.00,1800.00,30.00),
      ('MOV-02',1,7102,'E','2026-09-30 17:40:00',1,0,216.00,1200.00,24.00),
      ('MOV-03',2,7103,'E','2026-09-10 09:05:00',1,0,130.00,650.00,13.00),
      ('MOV-04',1,7104,'E','2026-09-14 14:30:00',0,0,150.00,800.00,16.00),
      ('MOV-05',1,7105,'E','2026-09-20 11:15:00',1,1,70.00,500.00,10.00),
      ('MOV-06',1,7106,'E','2026-08-28 10:15:00',1,0,180.00,1000.00,20.00),
      ('MOV-07',1,7107,'S','2026-09-12 16:00:00',1,0,50.00,400.00,9.00),
      ('MOV-08',1,7108,'E','2026-09-25 08:50:00',1,0,36.00,200.00,0.00);

    CREATE TABLE Movimento_Produto (
      Ide TEXT PRIMARY KEY,
      Movimento__Ide TEXT,
      Sequencia INTEGER,
      Tipo TEXT,
      ICMS_CST TEXT,
      ICMS_Perc REAL,
      Valor_ICMS REAL,
      Base_ICMS REAL,
      vBCFCP REAL,
      pFCP REAL,
      vFCP REAL,
      CFOP INTEGER
    );
    INSERT INTO Movimento_Produto VALUES
      ('IT-01','MOV-01',1,'P','60',18.00,180.00,1000.00,1000.00,2.0000,20.00,1403),
      ('IT-02','MOV-01',2,'P','60',12.00,60.00,500.00,500.00,2.0000,10.00,1910),
      ('IT-03','MOV-01',3,'P','00',18.00,54.00,300.00,0.00,0.0000,0.00,1403),
      ('IT-04','MOV-01',4,'C','00',18.00,36.00,200.00,0.00,0.0000,0.00,1102),
      ('IT-05','MOV-02',1,'P','60',18.00,144.00,800.00,800.00,2.0000,16.00,1403),
      ('IT-06','MOV-02',2,'P','60',18.00,72.00,400.00,400.00,2.0000,8.00,1102),
      ('IT-07','MOV-03',1,'P','60',18.00,108.00,600.00,600.00,2.0000,12.00,1403),
      ('IT-08','MOV-04',1,'P','60',18.00,126.00,700.00,700.00,2.0000,14.00,1403),
      ('IT-09','MOV-05',1,'P','60',12.00,54.00,450.00,450.00,2.0000,9.00,1910),
      ('IT-10','MOV-06',1,'P','60',18.00,162.00,900.00,900.00,2.0000,18.00,1403),
      ('IT-11','MOV-07',1,'P','60',12.00,42.00,350.00,350.00,2.0000,7.00,5405),
      ('IT-12','MOV-08',1,'I','00',18.00,36.00,200.00,0.00,0.0000,0.00,1102);
  `,
    objectives: [
        {
            id: "o1",
            xp: 30,
            kind: "select",
            question:
                "Liste os itens de movimentos de entrada (Tipo = 'E') da Filial 1, efetivados e com recebimento da nota em setembro de 2026, que tenham ICMS_CST '60' e CFOP 1403 ou 1910. Traga as colunas Sequencia, Base_ICMS, Valor_ICMS e ICMS_Perc (do item), nessa ordem.",
            hint: "Junte Movimento_Produto com Movimento por Movimento__Ide. A data de recebimento tem hora, então compare com date(coluna) em vez do texto inteiro.",
            refSQL: `SELECT m.Sequencia, mp.Base_ICMS, mp.Valor_ICMS, mp.ICMS_Perc
               FROM Movimento_Produto mp
               JOIN Movimento m ON m.Ide = mp.Movimento__Ide
               WHERE m.Tipo = 'E' AND m.Filial__Codigo = 1
                 AND m.Efetivado = 1 AND m.Desefetivado = 0
                 AND date(m.NotaEntradaRecebimento) BETWEEN '2026-09-01' AND '2026-09-30'
                 AND mp.ICMS_CST = '60'
                 AND mp.CFOP IN (1403, 1910);`,
        },
        {
            id: "o2",
            xp: 45,
            kind: "update",
            question:
                "O contador pediu para zerar a base, a alíquota e o valor de ICMS, e também a base, a alíquota e o valor de FCP, dos itens que a consulta anterior retornou.",
            hint: "Para a resolução dos desafios utilizamos a sintaxe do SQLITE então o filtro do UPDATE depende de colunas de Movimento não aceitando o uso de JOINS. Use WHERE Movimento__Ide IN (SELECT Ide FROM Movimento WHERE ...) e repita as condições do objetivo anterior.",
            refSQL: `UPDATE Movimento_Produto
               SET Base_ICMS = 0, Valor_ICMS = 0, ICMS_Perc = 0,
                   vBCFCP = 0, pFCP = 0, vFCP = 0
               WHERE ICMS_CST = '60'
                 AND CFOP IN (1403, 1910)
                 AND Movimento__Ide IN (
                   SELECT Ide FROM Movimento
                   WHERE Tipo = 'E' AND Filial__Codigo = 1
                     AND Efetivado = 1 AND Desefetivado = 0
                     AND date(NotaEntradaRecebimento) BETWEEN '2026-09-01' AND '2026-09-30'
                 );`,
            verifySQL: `SELECT Ide, ROUND(Base_ICMS,2) AS Base_ICMS, ROUND(Valor_ICMS,2) AS Valor_ICMS,
                         ROUND(ICMS_Perc,2) AS ICMS_Perc, ROUND(vBCFCP,2) AS vBCFCP,
                         ROUND(pFCP,4) AS pFCP, ROUND(vFCP,2) AS vFCP
                  FROM Movimento_Produto ORDER BY Ide;`,
        },
        {
            id: "o3",
            xp: 60,
            kind: "update",
            question:
                "Depois de zerar os itens, os totais do cabeçalho ficaram desatualizados. Recalcule Valor_ICMS, Base_ICMS e vFCP de cada movimento de entrada (Tipo = 'E') da Filial 1, efetivado (Efetivado = 1 e Desefetivado = 0) e com recebimento da nota em setembro de 2026, como a soma dos mesmos campos dos seus itens, desconsiderando os itens com Tipo 'C' ou 'I'. Movimento sem nenhum item somável deve ficar com 0, e não com vazio (NULL). Nenhum outro movimento pode ser alterado.",
            hint: "Use uma subconsulta com SUM para cada coluna no SET, ligando o item ao movimento pelo Ide. Envolva cada soma em IFNULL(..., 0) para o caso de não haver itens.",
            refSQL: `UPDATE Movimento
               SET Valor_ICMS = IFNULL((SELECT SUM(mp.Valor_ICMS) FROM Movimento_Produto mp
                                        WHERE mp.Movimento__Ide = Movimento.Ide
                                          AND mp.Tipo NOT IN ('C','I')), 0),
                   Base_ICMS  = IFNULL((SELECT SUM(mp.Base_ICMS) FROM Movimento_Produto mp
                                        WHERE mp.Movimento__Ide = Movimento.Ide
                                          AND mp.Tipo NOT IN ('C','I')), 0),
                   vFCP       = IFNULL((SELECT SUM(mp.vFCP) FROM Movimento_Produto mp
                                        WHERE mp.Movimento__Ide = Movimento.Ide
                                          AND mp.Tipo NOT IN ('C','I')), 0)
               WHERE Tipo = 'E' AND Filial__Codigo = 1
                 AND Efetivado = 1 AND Desefetivado = 0
                 AND date(NotaEntradaRecebimento) BETWEEN '2026-09-01' AND '2026-09-30';`,
            verifySQL: `SELECT Ide, ROUND(Valor_ICMS,2) AS Valor_ICMS, ROUND(Base_ICMS,2) AS Base_ICMS,
                         ROUND(vFCP,2) AS vFCP
                  FROM Movimento ORDER BY Ide;`,
        },
    ],
};