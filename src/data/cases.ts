import type { Case } from "../types/case";

export const CASES: Case[] = [
  {
    id: "dup-chamados",
    caseNumber: "031",
    title: "Chamados Duplicados",
    level: "Iniciante",
    category: "Suporte Técnico",
    tables: "clientes, chamados",
    context:
      "O supervisor recebeu reclamações de clientes que dizem ter aberto o mesmo chamado várias vezes, mas o painel mostra só um card por vez. Investigue a tabela de chamados e descubra onde estão as duplicidades.",
    setupSQL: `
      CREATE TABLE clientes (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        email TEXT
      );
      INSERT INTO clientes (id, nome, email) VALUES
        (1,'Marcos Aurélio Lima','marcos.lima@exemplo.com'),
        (2,'Fernanda Souza Prado','fernanda.prado@exemplo.com'),
        (3,'Renato Castro Alves','renato.alves@exemplo.com'),
        (4,'Juliana Torres Melo','juliana.melo@exemplo.com'),
        (5,'Paulo Henrique Rocha','paulo.rocha@exemplo.com'),
        (6,'Camila Nogueira Diaz','camila.diaz@exemplo.com');

      CREATE TABLE chamados (
        id INTEGER PRIMARY KEY,
        cliente_id INTEGER,
        categoria TEXT,
        descricao TEXT,
        data_abertura TEXT,
        status TEXT
      );
      INSERT INTO chamados (id, cliente_id, categoria, descricao, data_abertura, status) VALUES
        (101,1,'Internet Instável','Conexão cai a cada 10 minutos','2024-03-11','Resolvido'),
        (102,1,'Internet Instável','Conexão cai a cada 10 minutos, de novo','2024-03-11','Resolvido'),
        (103,2,'Fatura Incorreta','Cobrança duplicada na fatura','2024-03-11','Aberto'),
        (104,3,'Internet Instável','Sinal fraco no período da noite','2024-03-12','Resolvido'),
        (105,4,'Troca de Equipamento','Roteador não liga','2024-03-12','Resolvido'),
        (106,4,'Troca de Equipamento','Roteador não liga, ainda sem solução','2024-03-12','Aberto'),
        (107,5,'Fatura Incorreta','Valor cobrado maior que o plano','2024-03-13','Resolvido'),
        (108,2,'Fatura Incorreta','Cobrança duplicada, abri de novo','2024-03-11','Aberto'),
        (109,6,'Lentidão','Velocidade abaixo do contratado','2024-03-13','Resolvido'),
        (110,3,'Internet Instável','Sinal fraco à noite, segunda tentativa','2024-03-12','Resolvido'),
        (111,5,'Lentidão','Velocidade abaixo do contratado','2024-03-14','Aberto'),
        (112,6,'Lentidão','Velocidade abaixo do contratado, mesma reclamação','2024-03-13','Resolvido'),
        (113,1,'Fatura Incorreta','Dúvida sobre valor extra','2024-03-15','Resolvido'),
        (114,4,'Troca de Equipamento','Cabo de rede danificado','2024-03-16','Resolvido');
    `,
    objectives: [
      {
        id: "o1",
        xp: 10,
        question:
          "Liste todos os chamados da categoria 'Internet Instável' abertos em '2024-03-11'.",
        hint: "Use WHERE com duas condições unidas por AND.",
        refSQL:
          "SELECT * FROM chamados WHERE categoria='Internet Instável' AND data_abertura='2024-03-11';",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Encontre os clientes que abriram mais de um chamado na mesma categoria, no mesmo dia (nome, categoria, data e quantidade).",
        hint: "Agrupe por cliente, categoria e data; depois filtre os grupos com HAVING COUNT(*) > 1.",
        refSQL: `SELECT c.nome, ch.categoria, ch.data_abertura, COUNT(*) AS total
                 FROM chamados ch
                 JOIN clientes c ON c.id = ch.cliente_id
                 GROUP BY ch.cliente_id, ch.categoria, ch.data_abertura
                 HAVING COUNT(*) > 1;`,
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Qual categoria concentrou o maior número de chamados duplicados no total?",
        hint: "Primeiro identifique os grupos duplicados (como no objetivo anterior). Depois some o total por categoria e ordene do maior para o menor.",
        refSQL: `WITH dups AS (
                   SELECT cliente_id, categoria, data_abertura, COUNT(*) AS total
                   FROM chamados
                   GROUP BY cliente_id, categoria, data_abertura
                   HAVING COUNT(*) > 1
                 )
                 SELECT categoria, SUM(total) AS total_chamados
                 FROM dups
                 GROUP BY categoria
                 ORDER BY total_chamados DESC
                 LIMIT 1;`,
      },
    ],
  },
  {
    id: "sla-alta",
    caseNumber: "045",
    title: "Violação de SLA",
    level: "Intermediário",
    category: "Qualidade / SLA",
    tables: "chamados, sla_config",
    context:
      "O time de qualidade quer saber quantos chamados de prioridade 'Alta' estouraram o prazo de atendimento (SLA). Cada prioridade tem um limite de horas configurado.",
    setupSQL: `
      CREATE TABLE sla_config (
        prioridade TEXT PRIMARY KEY,
        horas_limite INTEGER
      );
      INSERT INTO sla_config (prioridade, horas_limite) VALUES
        ('Alta',4),
        ('Media',12),
        ('Baixa',24);

      CREATE TABLE chamados (
        id INTEGER PRIMARY KEY,
        cliente TEXT,
        categoria TEXT,
        prioridade TEXT,
        data_abertura TEXT,
        data_resolucao TEXT,
        status TEXT
      );
      INSERT INTO chamados (id, cliente, categoria, prioridade, data_abertura, data_resolucao, status) VALUES
        (201,'Marcos Lima','Servidor Fora do Ar','Alta','2024-04-02 08:00','2024-04-02 09:30','Resolvido'),
        (202,'Fernanda Prado','Servidor Fora do Ar','Alta','2024-04-02 10:00','2024-04-02 16:45','Resolvido'),
        (203,'Renato Alves','Erro de Login','Alta','2024-04-03 09:15','2024-04-03 11:00','Resolvido'),
        (204,'Juliana Melo','Falha de Backup','Alta','2024-04-03 14:00',NULL,'Aberto'),
        (205,'Paulo Rocha','Erro de Login','Alta','2024-04-04 07:30','2024-04-04 15:10','Resolvido'),
        (206,'Camila Diaz','Lentidão no Sistema','Media','2024-04-04 08:00','2024-04-04 18:00','Resolvido'),
        (207,'Marcos Lima','Erro de Login','Alta','2024-04-05 13:00','2024-04-05 14:20','Resolvido'),
        (208,'Fernanda Prado','Falha de Backup','Alta','2024-04-05 09:00','2024-04-06 09:00','Resolvido');
    `,
    objectives: [
      {
        id: "o1",
        xp: 10,
        question:
          "Liste todos os chamados de prioridade 'Alta' que já foram resolvidos (data_resolucao preenchida).",
        hint: "Filtre por prioridade e use IS NOT NULL para pegar só os resolvidos.",
        refSQL:
          "SELECT * FROM chamados WHERE prioridade='Alta' AND data_resolucao IS NOT NULL;",
      },
      {
        id: "o2",
        xp: 20,
        question:
          "Calcule quantas horas cada chamado 'Alta' resolvido levou até a resolução (id e horas).",
        hint: "julianday(data_fim) - julianday(data_inicio) dá a diferença em dias. Multiplique por 24 para virar horas.",
        refSQL: `SELECT id, ROUND((julianday(data_resolucao) - julianday(data_abertura)) * 24, 2) AS horas
                 FROM chamados
                 WHERE prioridade='Alta' AND data_resolucao IS NOT NULL;`,
      },
      {
        id: "o3",
        xp: 30,
        question:
          "Encontre os chamados 'Alta' que estouraram o SLA configurado em sla_config (id, cliente e horas gastas).",
        hint: "Junte chamados com sla_config pela prioridade e compare as horas calculadas com horas_limite.",
        refSQL: `SELECT ch.id, ch.cliente,
                        ROUND((julianday(ch.data_resolucao) - julianday(ch.data_abertura)) * 24, 2) AS horas
                 FROM chamados ch
                 JOIN sla_config s ON s.prioridade = ch.prioridade
                 WHERE ch.prioridade = 'Alta'
                   AND ch.data_resolucao IS NOT NULL
                   AND (julianday(ch.data_resolucao) - julianday(ch.data_abertura)) * 24 > s.horas_limite;`,
      },
    ],
  },
];
