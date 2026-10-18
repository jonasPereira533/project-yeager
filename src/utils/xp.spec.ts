import { describe, expect, it } from "vitest";
import type { Case } from "../types/case";
import { CASES } from "../data/cases";
import {
  HINT_PENALTY,
  computeTotalXP,
  countHints,
  progressKey,
  toProgressKeys,
} from "./xp";

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

describe("chave de progresso", () => {
  it("junta caso e objetivo com dois pontos", () => {
    expect(progressKey("clientes-bloqueados", "o2")).toBe(
      "clientes-bloqueados:o2",
    );
  });

  it("achata o mapa por caso na mesma ordem", () => {
    expect(toProgressKeys({ c1: ["o1", "o2"], c2: ["o1"] })).toEqual([
      "c1:o1",
      "c1:o2",
      "c2:o1",
    ]);
  });

  it("ignora casos sem objetivos resolvidos", () => {
    expect(toProgressKeys({ c1: [], c2: undefined })).toEqual([]);
  });
});

describe("contagem de dicas", () => {
  it("conta cada dica uma vez so", () => {
    expect(countHints(["c1:o1", "c1:o1", "c1:o2"])).toBe(2);
  });

  it("nenhuma dica e zero", () => {
    expect(countHints([])).toBe(0);
  });
});

describe("XP total", () => {
  it("soma o xp so dos objetivos resolvidos", () => {
    expect(computeTotalXP(ARCHIVE, ["c1:o1", "c2:o1"], [])).toBe(40);
  });

  it("objetivo de outro caso nao conta", () => {
    expect(computeTotalXP(ARCHIVE, ["c2:o1"], [])).toBe(10);
  });

  it("desconta o valor fixo por dica usada", () => {
    expect(computeTotalXP(ARCHIVE, ["c1:o1"], ["c1:o2"])).toBe(
      30 - HINT_PENALTY,
    );
  });

  it("a mesma dica nao e cobrada duas vezes", () => {
    expect(computeTotalXP(ARCHIVE, ["c1:o1"], ["c1:o2", "c1:o2"])).toBe(
      30 - HINT_PENALTY,
    );
  });

  it("nunca fica negativo", () => {
    expect(computeTotalXP(ARCHIVE, [], ["c1:o1", "c1:o2", "c2:o1"])).toBe(0);
  });

  it("arquivo vazio e zero", () => {
    expect(computeTotalXP([], ["c1:o1"], [])).toBe(0);
  });

  it("bate com a media de XP por objetivo do arquivo real", () => {
    const totalCaseXp = CASES.reduce(
      (sum, c) => sum + c.objectives.reduce((s, o) => s + o.xp, 0),
      0,
    );
    const allKeys = CASES.flatMap((c) => c.objectives.map((o) => progressKey(c.id, o.id)));

    expect(computeTotalXP(CASES, allKeys, [])).toBe(totalCaseXp);
    expect(computeTotalXP(CASES, [], [])).toBe(0);
  });
});
