import type { Case } from "../../types/case";

export const caso005: Case = {
  id: "itens-fora-preco-tabela",
  caseNumber: "005",
  title: "Itens Vendidos Fora do Preço de Tabela",
  level: "Intermediário",
  category: "Suporte Técnico — Vendas",
  tables: "Movimento_Produto, Produto",
  context:
    "O setor comercial percebeu que alguns itens foram vendidos com valor diferente do preço de tabela cadastrado no produto, e quer localizar exatamente quais vendas fugiram do preço oficial.",
  setupSQL: `
      CREATE TABLE Produto (Codigo TEXT PRIMARY KEY, Nome TEXT, Preco1 REAL);
      INSERT INTO Produto VALUES
        ('P001','Óleo Motor 1L',45.00),
        ('P002','Filtro de Ar',32.00),
        ('P003','Pastilha de Freio',89.00),
        ('P004','Bateria 60Ah',420.00);

      CREATE TABLE Movimento_Produto (
        Filial__Codigo INTEGER,
        Sequencia INTEGER,
        Produto__Codigo TEXT,
        Qtde REAL,
        Valor_Unit REAL
      );
      INSERT INTO Movimento_Produto VALUES
        (1,1001,'P001',2,45.00),
        (1,1002,'P002',1,28.00),
        (1,1003,'P003',1,89.00),
        (1,1004,'P002',3,30.00),
        (2,2001,'P004',1,400.00),
        (2,2002,'P001',4,45.00),
        (2,2003,'P002',2,25.00),
        (2,2004,'P003',1,95.00),
        (1,1005,'P004',1,420.00);
    `,
  objectives: [
    {
      id: "o1",
      xp: 15,
      question:
        "Liste sequencia, nome do produto, valor unitario e preço de vendas em que o valor unitário vendido é diferente do preço de tabela do produto.",
      hint: "Junte Movimento_Produto com Produto pelo código; compare Valor_Unit com Preco1 usando <>.",
      refSQL:
        "SELECT mp.Sequencia, p.Nome, mp.Valor_Unit, p.Preco1 FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit <> p.Preco1;",
    },
    {
      id: "o2",
      xp: 20,
      question:
        "Entre essas vendas, considere apenas os itens vendidos ABAIXO do preço de tabela e mostre quanto foi dado de" +
        " desconto em cada um (preço de tabela menos valor vendido). Traga as colunas Sequencia, Nome (do produto) e a diferença.",
      hint: "Troque a comparação por < pra pegar só o que foi vendido mais barato que a tabela.",
      refSQL:
        "SELECT mp.Sequencia, p.Nome, (p.Preco1 - mp.Valor_Unit) AS diferenca FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Preco1;",
    },
    {
      id: "o3",
      xp: 30,
      question:
        "Entre os itens vendidos abaixo do preço de tabela, descubra quais produtos aparecem mais de uma vez. " +
        "Retorne o nome do produto a quantidade de vendas abaixo do preço, com o produto mais frequente primeiro.",
      hint: "Agrupe pelo produto, conte as ocorrências e use HAVING > 1.",
      refSQL:
        "SELECT p.Nome, COUNT(*) AS total FROM Movimento_Produto mp JOIN Produto p ON p.Codigo = mp.Produto__Codigo WHERE mp.Valor_Unit < p.Preco1 GROUP BY p.Codigo HAVING COUNT(*) > 1 ORDER BY total DESC;",
    },
  ],
};
