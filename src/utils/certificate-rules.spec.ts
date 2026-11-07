import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CASES } from "../data/cases";
import { CERTIFICATE_CONFIG } from "../data/certificate-config";

const rulesSource = readFileSync(
  resolve(import.meta.dirname, "../../firestore.rules"),
  "utf8",
);

describe("certificados x firestore.rules", () => {
  it("o bloco existe antes do catch-all", () => {
    const at = rulesSource.indexOf("match /certificates/{code} {");
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(rulesSource.indexOf("match /{document=**} {"));
  });

  it("a busca por codigo e publica, mas listar so vale para o dono", () => {
    expect(rulesSource).toContain("allow get: if true;");
    expect(rulesSource).toMatch(
      /allow list: if request\.auth != null\s+&& resource\.data\.uid == request\.auth\.uid;/,
    );
    expect(rulesSource).toContain("allow update, delete: if false;");
  });

  it("o minimo de objetivos nas regras acompanha os casos do app", () => {
    const total = CASES.reduce((sum, item) => sum + item.objectives.length, 0);
    const match = rulesSource.match(
      /certificateMinSolved\(\) \{\s*return (\d+);/,
    );
    expect(Number(match?.[1])).toBe(total);
  });

  it("a carga horaria nas regras acompanha a configuracao", () => {
    const match = rulesSource.match(/request\.resource\.data\.hours == (\d+)/);
    expect(Number(match?.[1])).toBe(CERTIFICATE_CONFIG.hours);
  });
});
