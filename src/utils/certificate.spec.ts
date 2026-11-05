import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CERTIFICATE_CONFIG } from "../data/certificate-config";
import {
  buildCertificate,
  certificateFileName,
  formatIssueDate,
} from "./certificate";

const DATA = {
  name: "Maria da Conceição",
  casesCount: 14,
  objectivesCount: 42,
  totalXP: 1285,
  issuedAt: new Date(2026, 10, 4),
};

describe("certificateFileName", () => {
  it("remove acentos e espacos", () => {
    expect(certificateFileName("Maria da Conceição")).toBe(
      "certificado-yeager-maria-da-conceicao.pdf",
    );
  });
  it("funciona com nome vazio", () => {
    expect(certificateFileName("  ")).toBe("certificado-yeager.pdf");
  });
});

describe("formatIssueDate", () => {
  it("escreve a data por extenso em pt-BR", () => {
    expect(formatIssueDate(DATA.issuedAt)).toBe("4 de novembro de 2026");
  });
});

describe("buildCertificate", () => {
  it("gera um PDF com nome, XP e carga horaria", async () => {
    const blob = await buildCertificate(DATA, CERTIFICATE_CONFIG);
    expect(blob.type).toBe("application/pdf");
    const text = Buffer.from(await blob.arrayBuffer()).toString("latin1");
    expect(text.startsWith("%PDF")).toBe(true);
    expect(text).toContain("Maria da Concei");
    expect(text).toContain("1285");
    expect(text).toContain("10 \\(DEZ\\)");
  });

  it("embute a fonte cursiva e a assinatura sem quebrar", async () => {
    const font = readFileSync(
      new URL("../assets/fonts/great-vibes.ttf", import.meta.url),
    ).toString("base64");
    const signature = `data:image/png;base64,${readFileSync(
      new URL("../assets/assinatura.png", import.meta.url),
    ).toString("base64")}`;
    const blob = await buildCertificate(
      { ...DATA, nameFontBase64: font, signatureDataUrl: signature },
      CERTIFICATE_CONFIG,
    );
    expect(blob.size).toBeGreaterThan(50_000);
  });
});
