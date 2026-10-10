import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CASES } from "../data/cases";

/**
 * `validCaseIds()` em firestore.rules e uma lista digitada a mao que precisa
 * continuar batendo com src/data/cases.ts. Sem este teste a divergencia passa
 * despercebida e a escrita comeca a ser negada em producao.
 */
const rulesSource = readFileSync(
  resolve(import.meta.dirname, "../../firestore.rules"),
  "utf8",
);

function caseIdsFromRules(): string[] {
  const block = rulesSource.match(
    /function validCaseIds\(\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\]/,
  );
  if (!block?.[1]) throw new Error("validCaseIds() nao encontrada nas rules");
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe("firestore.rules x src/data/cases.ts", () => {
  it("os ids de caso das rules sao os mesmos de CASES", () => {
    expect(caseIdsFromRules().sort()).toEqual(CASES.map((c) => c.id).sort());
  });

  it("a lista de ids nao tem repetidos", () => {
    const ids = caseIdsFromRules();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("draftsByCase esta autorizado nas regras", () => {
    expect(rulesSource).toContain("'draftsByCase'");
  });

  it("draftsByCase fica fora da verificacao monotonica", () => {
    // Rascunho sobrescreve, então não pode passar por isMonotonic.
    expect(rulesSource).toContain(
      "field == 'draftsByCase' || isMonotonic(field)",
    );
  });

  it("os objetivos de cada caso cabem em validObjectiveIds", () => {
    const block = rulesSource.match(
      /validObjectiveIds\(\)\s*\{\s*return\s*\[([\s\S]*?)\]/,
    );
    if (!block?.[1]) {
      throw new Error("validObjectiveIds() nao encontrada nas rules");
    }
    const valid = new Set(
      [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]),
    );
    for (const caseItem of CASES) {
      for (const objective of caseItem.objectives) {
        expect(valid.has(objective.id)).toBe(true);
      }
    }
  });
});