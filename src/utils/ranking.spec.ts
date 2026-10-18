import { describe, expect, it } from "vitest";
import type { Case } from "../types/case";
import { CASES } from "../data/cases";
import {
  badgesFor,
  buildRankEntry,
  firstFinisherUid,
  firstName,
  rankEntries,
  shouldStampCompletion,
  withoutStaff,
  type LeaderboardSource,
} from "./ranking";

const ARCHIVE: Case[] = [
  {
    id: "c1",
    caseNumber: "001",
    title: "Um",
    level: "Iniciante",
    category: "x",
    tables: "t",
    context: "x",
    setupSQL: "",
    objectives: [
      { id: "o1", xp: 30, question: "", hint: "", refSQL: "" },
      { id: "o2", xp: 20, question: "", hint: "", refSQL: "" },
    ],
  },
  {
    id: "c2",
    caseNumber: "002",
    title: "Dois",
    level: "Intermediário",
    category: "x",
    tables: "t",
    context: "x",
    setupSQL: "",
    objectives: [{ id: "o1", xp: 10, question: "", hint: "", refSQL: "" }],
  },
];

const ALL_KEYS = ["c1:o1", "c1:o2", "c2:o1"];

function source(
  partial: Partial<LeaderboardSource> & { uid: string },
): LeaderboardSource {
  return {
    displayName: partial.uid,
    solved: [],
    hints: [],
    completedAtMillis: null,
    sector: null,
    ...partial,
  };
}

describe("primeiro nome", () => {
  it("guarda so o primeiro nome do google", () => {
    expect(firstName("Jonas Pereira da Silva")).toBe("Jonas");
  });

  it("normaliza espacos sobrando", () => {
    expect(firstName("  Jonas   Pereira  ")).toBe("Jonas");
  });

  it("sem nome vira Agente", () => {
    expect(firstName(null)).toBe("Agente");
    expect(firstName(undefined)).toBe("Agente");
    expect(firstName("   ")).toBe("Agente");
  });

  it("corta no mesmo teto das regras", () => {
    expect(firstName("J".repeat(80))).toHaveLength(40);
  });
});

describe("linha do placar", () => {
  it("deriva xp, progresso e nome a partir das chaves", () => {
    const entry = buildRankEntry(
      source({
        uid: "u1",
        displayName: "Jonas Pereira",
        solved: ["c1:o1", "c1:o2"],
      }),
      ARCHIVE,
    );

    expect(entry.xp).toBe(50);
    expect(entry.name).toBe("Jonas");
    expect(entry.objectivesSolved).toBe(2);
    expect(entry.casesSolved).toBe(1);
    expect(entry.archiveComplete).toBe(false);
  });

  it("sobz o selo de sem dicas quando fechou a fila inteira", () => {
    const fechado = buildRankEntry(
      source({ uid: "u1", solved: ALL_KEYS, hints: [] }),
      ARCHIVE,
    );
    expect(fechado.archiveComplete).toBe(true);
    expect(fechado.withoutHints).toBe(true);

    const pelaMetade = buildRankEntry(
      source({ uid: "u2", solved: ["c1:o1"], hints: [] }),
      ARCHIVE,
    );
    expect(pelaMetade.withoutHints).toBe(false);
  });

  it("quem abriu dica e fechou a fila nao recebe o selo de sem dicas", () => {
    const entry = buildRankEntry(
      source({ uid: "u1", solved: ALL_KEYS, hints: ["c1:o1"] }),
      ARCHIVE,
    );
    expect(entry.archiveComplete).toBe(true);
    expect(entry.withoutHints).toBe(false);
  });

  it("caso sem objetivo nao entra na contagem de chamados", () => {
    const comVazio: Case[] = [
      ...ARCHIVE,
      {
        id: "c3",
        caseNumber: "003",
        title: "Vazio",
        level: "Iniciante",
        category: "x",
        tables: "t",
        context: "x",
        setupSQL: "",
        objectives: [],
      },
    ];

    const entry = buildRankEntry(
      source({ uid: "u1", solved: ALL_KEYS }),
      comVazio,
    );
    expect(entry.archiveComplete).toBe(false);
    expect(entry.casesSolved).toBe(2);
  });
});

describe("ordem do placar", () => {
  it("ordena por XP decrescente", () => {
    const entries = rankEntries(
      [
        source({ uid: "u1", solved: ["c1:o1"] }),
        source({ uid: "u2", solved: ALL_KEYS }),
      ],
      ARCHIVE,
    );

    expect(entries.map((e) => e.uid)).toEqual(["u2", "u1"]);
    expect(entries.map((e) => e.rank)).toEqual([1, 2]);
  });

  it("empatado em XP quem fechou a fila primeiro fica na frente", () => {
    const entries = rankEntries(
      [
        source({ uid: "u1", solved: ALL_KEYS, completedAtMillis: 2000 }),
        source({ uid: "u2", solved: ALL_KEYS, completedAtMillis: 1000 }),
      ],
      ARCHIVE,
    );

    expect(entries.map((e) => e.uid)).toEqual(["u2", "u1"]);
  });

  it("empatado em XP e no tempo, usa menos dicas fica na frente", () => {
    const entries = rankEntries(
      [
        source({ uid: "u1", solved: ALL_KEYS, hints: ["c1:o1", "c1:o2"] }),
        source({ uid: "u2", solved: ALL_KEYS, hints: ["c1:o1"] }),
      ],
      ARCHIVE,
    );

    expect(entries.map((e) => e.uid)).toEqual(["u2", "u1"]);
  });

  it("no empate total o nome decide, e nao a ordem de chegada", () => {
    const entries = rankEntries(
      [
        source({ uid: "zz", displayName: "Zeta", solved: ["c1:o1"] }),
        source({ uid: "aa", displayName: "Ana", solved: ["c1:o1"] }),
      ],
      ARCHIVE,
    );

    expect(entries.map((e) => e.uid)).toEqual(["aa", "zz"]);
  });

  it("quem nao fechou a fila nunca sobe na frente de quem fechou", () => {
    const entries = rankEntries(
      [
        source({ uid: "u1" }),
        source({ uid: "u2", solved: ALL_KEYS, completedAtMillis: 1000 }),
        source({ uid: "u3", solved: ALL_KEYS, completedAtMillis: 5000 }),
      ],
      ARCHIVE,
    );

    expect(entries.map((e) => e.uid)).toEqual(["u2", "u3", "u1"]);
  });

  it("lista vazia nao quebra", () => {
    expect(rankEntries([], ARCHIVE)).toEqual([]);
  });
});

describe("selos", () => {
  const board = rankEntries(
    [
      source({ uid: "u1", displayName: "Ana", solved: ALL_KEYS, completedAtMillis: 1000 }),
      source({ uid: "u2", displayName: "Bia", solved: ALL_KEYS }),
      source({ uid: "u3", displayName: "Cid", solved: ["c1:o1", "c2:o1"] }),
      source({ uid: "u4", displayName: "Dio", solved: ["c2:o1"] }),
    ],
    ARCHIVE,
  );

  it("o primeiro a fechar leva o selo, e so um", () => {
    const first = firstFinisherUid([
      source({ uid: "u2", completedAtMillis: 3000 }),
      source({ uid: "u1", completedAtMillis: 1000 }),
      source({ uid: "u3", completedAtMillis: null }),
    ]);

    const holders = board.filter((entry) =>
      badgesFor(entry, first).includes("first"),
    );
    expect(holders).toHaveLength(1);
  });

  it("quem nao fechou a fila nunca leva o selo de primeiro", () => {
    const first = firstFinisherUid(board);
    const last = board.find((entry) => entry.uid === "u4")!;
    expect(badgesFor(last, first)).not.toContain("first");
  });

  it("medalha vai para os tres primeiros", () => {
    const first = firstFinisherUid(board);
    expect(badgesFor(board[0], first)).toContain("gold");
    expect(badgesFor(board[1], first)).toContain("silver");
    expect(badgesFor(board[2], first)).toContain("bronze");
    expect(badgesFor(board[3], first)).not.toContain("bronze");
  });

  it("quem nao fechou a fila sem dicas leva esse selo", () => {
    const first = firstFinisherUid(board);
    const u3 = board.find((entry) => entry.uid === "u3")!;
    expect(badgesFor(u3, first)).not.toContain("noHints");
  });

  it("sem ninguem que fechou a fila, so vale a medalha de posicao", () => {
    const semFim = rankEntries(
      [source({ uid: "u1", solved: ["c1:o1"] })],
      ARCHIVE,
    );
    expect(firstFinisherUid(semFim)).toBeNull();
    expect(badgesFor(semFim[0], null)).toEqual(["gold"]);
  });

  it("empate no instante do fechamento nao premia duas linhas", () => {
    const empate = [
      source({ uid: "u9", solved: ALL_KEYS, completedAtMillis: 1000 }),
      source({ uid: "u2", solved: ALL_KEYS, completedAtMillis: 1000 }),
    ];
    const ordered = rankEntries(empate, ARCHIVE);
    const uid = firstFinisherUid(empate);

    expect(uid).toBe("u2");
    expect(ordered.filter((e) => badgesFor(e, uid).includes("first"))).toHaveLength(
      1,
    );
  });
});

describe("setores", () => {
  const board = [
    source({ uid: "p1", displayName: "Ana", solved: ALL_KEYS, sector: "Partner" }),
    source({ uid: "p2", displayName: "Bia", solved: ["c1:o1", "c2:o1"], sector: "Partner" }),
    source({ uid: "p3", displayName: "Cid", solved: ["c1:o1"], sector: "Partner" }),
    source({ uid: "p4", displayName: "Dio", solved: ["c2:o1"], sector: "Partner" }),
    source({
      uid: "f1",
      displayName: "Elo",
      solved: ALL_KEYS,
      hints: ["c1:o1"],
      sector: "Final",
    }),
  ];

  it("cada setor tem o proprio tres primeiros", () => {
    const partner = rankEntries(
      board.filter((s) => s.sector === "Partner"),
      ARCHIVE,
    );
    expect(partner.map((e) => e.uid)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(partner.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
    expect(badgesFor(partner[0], null)).toContain("gold");
    expect(badgesFor(partner[2], null)).toContain("bronze");
    expect(badgesFor(partner[3], null)).not.toContain("bronze");
  });

  it("lider de outro setor tem medalha pelo setor dele, nao pelo geral", () => {
    const final = rankEntries(
      board.filter((s) => s.sector === "Final"),
      ARCHIVE,
    );
    expect(final).toHaveLength(1);
    expect(badgesFor(final[0], null)).toEqual(["gold"]);
  });

  it("quem e 4o no setor nao leva medalha", () => {
    const partner = rankEntries(
      board.filter((s) => s.sector === "Partner"),
      ARCHIVE,
    );
    const quarto = partner.find((e) => e.uid === "p4")!;
    expect(quarto.rank).toBe(4);
    expect(badgesFor(quarto, null)).toEqual([]);
  });

  it("cada setor tem o seu proprio primeiro a fechar", () => {
    const comTempo = [
      source({ uid: "p1", solved: ALL_KEYS, completedAtMillis: 1000, sector: "Partner" }),
      source({
        uid: "p2",
        solved: ALL_KEYS,
        completedAtMillis: 8000,
        sector: "Partner",
      }),
      source({
        uid: "f1",
        solved: ALL_KEYS,
        hints: ["c1:o1"],
        completedAtMillis: 5000,
        sector: "Final",
      }),
    ];

    const partner = rankEntries(
      comTempo.filter((s) => s.sector === "Partner"),
      ARCHIVE,
    );
    const partnerList = comTempo.filter((s) => s.sector === "Partner");
    expect(firstFinisherUid(partnerList)).toBe("p1");
    expect(badgesFor(partner[0], firstFinisherUid(partnerList))).toContain("first");
    expect(badgesFor(partner[1], firstFinisherUid(partnerList))).not.toContain("first");

    const finalList = comTempo.filter((s) => s.sector === "Final");
    const final = rankEntries(finalList, ARCHIVE);
    expect(firstFinisherUid(finalList)).toBe("f1");
    expect(badgesFor(final[0], "f1")).toContain("first");
  });

  it("quem nao escolheu setor nao aparece em nenhum filtro", () => {
    const semSetor = source({ uid: "x1", solved: ["c1:o1"], sector: null });
    const tudo = [...board, semSetor];
    expect(rankEntries(tudo.filter((s) => s.sector === "Partner"), ARCHIVE)).toHaveLength(4);
    expect(rankEntries(tudo.filter((s) => s.sector === "Final"), ARCHIVE)).toHaveLength(1);
  });
});

describe("devs fora do placar", () => {
  it("tira da lista", () => {
    const board = [
      source({ uid: "d1", displayName: "Juarez", solved: ALL_KEYS }),
      source({ uid: "p1", displayName: "Ana", solved: ["c1:o1", "c2:o1"] }),
    ];
    const rankable = withoutStaff(board, new Set(["d1"]));
    expect(rankable.map((s) => s.uid)).toEqual(["p1"]);
  });

  it("quem tirou da lista sobe para o primeiro lugar", () => {
    const board = [
      source({ uid: "d1", solved: ALL_KEYS }),
      source({ uid: "p1", solved: ["c1:o1", "c2:o1"] }),
    ];
    const entries = rankEntries(withoutStaff(board, new Set(["d1"])), ARCHIVE);
    expect(entries[0].uid).toBe("p1");
    expect(entries[0].rank).toBe(1);
  });

  it("dev nao segura o selo de primeiro a fechar", () => {
    const board = [
      source({ uid: "d1", completedAtMillis: 1000 }),
      source({ uid: "p1", completedAtMillis: 5000 }),
    ];
    const rankable = withoutStaff(board, new Set(["d1"]));
    const entries = rankEntries(rankable, ARCHIVE);
    expect(firstFinisherUid(rankable)).toBe("p1");
    expect(badgesFor(entries[0], "p1")).toContain("first");
  });

  it("sem lista de devs, ninguem sai", () => {
    const board = [source({ uid: "p1" })];
    expect(withoutStaff(board, new Set())).toHaveLength(1);
  });
});

describe("carimbo de conclusão", () => {
  it("carimba quem fecha a fila agora", () => {
    expect(
      shouldStampCompletion({
        archiveComplete: true,
        celebratedOnDevice: false,
        stampedThisSession: false,
      }),
    ).toBe(true);
  });

  it("nao carimba quem ja tinha fechado antes do placar existir", () => {
    expect(
      shouldStampCompletion({
        archiveComplete: true,
        celebratedOnDevice: true,
        stampedThisSession: false,
      }),
    ).toBe(false);
  });

  it("nao carimba duas vezes na mesma sessao", () => {
    expect(
      shouldStampCompletion({
        archiveComplete: true,
        celebratedOnDevice: false,
        stampedThisSession: true,
      }),
    ).toBe(false);
  });

  it("nao carimba com a fila em aberto", () => {
    expect(
      shouldStampCompletion({
        archiveComplete: false,
        celebratedOnDevice: false,
        stampedThisSession: false,
      }),
    ).toBe(false);
  });
});

describe("placar com os casos reais", () => {
  it("quem resolveu tudo some os 100% do XP disponivel, sem dicas", () => {
    const total = CASES.reduce(
      (sum, c) => sum + c.objectives.reduce((s, o) => s + o.xp, 0),
      0,
    );
    const entry = buildRankEntry(
      source({
        uid: "u1",
        solved: CASES.flatMap((c) => c.objectives.map((o) => `${c.id}:${o.id}`)),
      }),
      CASES,
    );

    expect(entry.xp).toBe(total);
    expect(entry.casesSolved).toBe(CASES.length);
    expect(entry.archiveComplete).toBe(true);
    expect(entry.withoutHints).toBe(true);
  });
});
