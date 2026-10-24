import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CASES } from "../data/cases";
import { PROGRESS_KEY_SEPARATOR, progressKey } from "./xp";
import { LEADERBOARD_FIELDS, MAX_DISPLAY_NAME_LENGTH, SECTORS } from "./ranking";

const rulesSource = readFileSync(
  resolve(import.meta.dirname, "../../firestore.rules"),
  "utf8",
);

function quotedListAfter(source: string, label: string): string[] {
  const block = source.match(
    new RegExp(
      `${label}\\(\\)\\s*\\{[\\s\\S]*?\\[([\\s\\S]*?)\\]`,
    ),
  );
  if (!block?.[1]) throw new Error(`${label}() nao encontrada nas rules`);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function leaderboardBlock(): string {
  const block = rulesSource.match(/match \/leaderboard\/\{userId\} \{[\s\S]*?\n {4}\}/);
  if (!block?.[0]) throw new Error("match /leaderboard nao encontrado");
  return block[0];
}

describe("placar publico x firestore.rules", () => {
  it("o bloco do placar existe antes do catch-all", () => {
    expect(rulesSource).toContain("match /leaderboard/{userId} {");
    expect(rulesSource.indexOf("match /leaderboard/{userId} {")).toBeLessThan(
      rulesSource.indexOf("match /{document=**} {"),
    );
  });

  it("a leitura do placar e publica", () => {
    expect(leaderboardBlock()).toContain("allow read: if true;");
  });

  it("ninguem apaga a propria linha de placar", () => {
    expect(leaderboardBlock()).toContain("allow delete: if false;");
  });

  it("escrever linha de placar alheia e negado", () => {
    const block = leaderboardBlock();
    expect(block).toContain("allow create: if isOwner(userId)");
    expect(block).toContain("allow update: if isOwner(userId)");
  });

  it("os campos que o cliente escreve sao exatamente os aceitos", () => {
    expect(
      quotedListAfter(rulesSource, "hasOnlyLeaderboardFields").sort(),
    ).toEqual([...LEADERBOARD_FIELDS].sort());
  });

  it("o teto do nome e o mesmo codigo nas regras", () => {
    expect(rulesSource).toContain(
      `request.resource.data.displayName.size() <= ${MAX_DISPLAY_NAME_LENGTH}`,
    );
  });

  it("a chave que o cliente monta bate com a allowlist das regras", () => {
    const allowed = new Set(quotedListAfter(rulesSource, "validObjectiveKeys"));

    for (const caseItem of CASES) {
      for (const objective of caseItem.objectives) {
        const key = progressKey(caseItem.id, objective.id);
        expect(key.split(PROGRESS_KEY_SEPARATOR)).toHaveLength(2);
        expect(allowed.has(key)).toBe(true);
      }
    }
  });

  it("toda chave que o cliente monta passa na validacao das regras", () => {
    const caseIds = quotedListAfter(rulesSource, "validCaseIds");
    const objectiveIds = quotedListAfter(rulesSource, "validObjectiveIds");

    for (const caseItem of CASES) {
      expect(caseIds).toContain(caseItem.id);
      for (const objective of caseItem.objectives) {
        expect(objectiveIds).toContain(objective.id);

        const parts = progressKey(caseItem.id, objective.id).split(
          PROGRESS_KEY_SEPARATOR,
        );
        expect(parts).toHaveLength(2);
        expect(caseIds).toContain(parts[0]);
        expect(objectiveIds).toContain(parts[1]);
      }
    }
  });

  it("updatedAt e carimbado pelo servidor, nao pelo cliente", () => {
    const block = leaderboardBlock();
    expect(block).toContain("request.resource.data.updatedAt == request.time");
  });

  it("completedAt nao pode ser alterado depois de carimbado", () => {
    expect(rulesSource).toContain(
      "request.resource.data.completedAt == resource.data.completedAt",
    );
  });

  it("ninguem entra no placar sem fechar o primeiro objetivo", () => {
    expect(rulesSource).toContain(
      "&& request.resource.data.solved.size() > 0",
    );
  });

  it("as listas so podem crescer", () => {
    const block = leaderboardBlock();
    expect(block).toContain("isGrowingList('solved')");
    expect(block).toContain("isGrowingList('hints')");
  });
});

describe("setores x firestore.rules", () => {
  it("os setores aceitos pelas regras sao os mesmos de SECTORS", () => {
    expect(quotedListAfter(rulesSource, "validSectorIds")).toEqual([
      ...SECTORS,
    ]);
  });

  it("'Implantação' sobrevive a acento no arquivo de regras", () => {
    expect(rulesSource).toContain("'Implantação'");
  });

  it("o setor e validado contra a allowlist", () => {
    expect(rulesSource).toContain("isValidSector()");
    expect(rulesSource).toContain("request.resource.data.sector in validSectorIds()");
  });

  it("o setor nao e exigido, para a linha nascer antes da escolha", () => {
    expect(rulesSource).toContain("!('sector' in request.resource.data)");
  });

  it("setor ja escolhido fica travado", () => {
    expect(rulesSource).toContain(
      "request.resource.data.sector == resource.data.sector",
    );
    expect(leaderboardBlock()).toContain("keepsSector()");
  });

  it("linha sem setor pode ganhar um, e assim que a migracao acontece", () => {
    expect(rulesSource).toContain("!('sector' in resource.data)");
  });
});

describe("devs x firestore.rules", () => {
  function devsBlock(): string {
    const block = rulesSource.match(/match \/devs\/\{userId\} \{[\s\S]*?\n {4}\}/);
    if (!block?.[0]) throw new Error("match /devs nao encontrado");
    return block[0];
  }

  it("o bloco existe antes do catch-all", () => {
    expect(rulesSource).toContain("match /devs/{userId} {");
    expect(rulesSource.indexOf("match /devs/{userId} {")).toBeLessThan(
      rulesSource.indexOf("match /{document=**} {"),
    );
  });

  it("a leitura e publica", () => {
    expect(devsBlock()).toContain("allow read: if true;");
  });

  it("ninguem escreve: nem o dono da propria linha", () => {
    expect(devsBlock()).toContain("allow write: if false;");
  });
});
