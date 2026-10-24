import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CASES } from "../data/cases";

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

function caseIdsMentionedIn(functionName: string): string[] {
  const block = rulesSource.match(
    new RegExp(
      `function ${functionName}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n {4}\\}`,
    ),
  );
  if (!block?.[0]) throw new Error(`${functionName}() nao encontrada nas rules`);
  return [...new Set([...block[0].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]))];
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
    const guarded = [
      ...rulesSource.matchAll(
        /hasAny\(\['(\w+)'\]\)\s*\|\| isMonotonic\('(\w+)'\)/g,
      ),
    ].map((match) => match[2]);

    expect(guarded).toContain("solvedByCase");
    expect(guarded).toContain("hintsUsedByCase");
    expect(guarded).not.toContain("draftsByCase");
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

  it("todo caso novo entra tambem nas listas por caso das regras", () => {
    const expected = CASES.map((c) => c.id).sort();
    for (const functionName of [
      "isValidProgressMap",
      "isMonotonicMaps",
      "isValidDraftsMap",
    ]) {
      expect(caseIdsMentionedIn(functionName).sort()).toEqual(expected);
    }
  });

  it("todo caso novo entra na allowlist de chaves do placar", () => {
    const block = rulesSource.match(
      /function validObjectiveKeys\(\)\s*\{\s*return\s*\[([\s\S]*?)\]/,
    );
    if (!block?.[1]) {
      throw new Error("validObjectiveKeys() nao encontrada nas rules");
    }
    const allowed = new Set(
      [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]),
    );
    for (const caseItem of CASES) {
      for (const objective of caseItem.objectives) {
        expect(allowed.has(`${caseItem.id}:${objective.id}`)).toBe(true);
      }
    }
  });
});