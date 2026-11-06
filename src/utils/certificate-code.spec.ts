import { describe, expect, it } from "vitest";
import {
  certificateValidationUrl,
  generateCertificateCode,
  isCertificateCode,
  normalizeCertificateCode,
  withoutProtocol,
} from "./certificate-code";

describe("generateCertificateCode", () => {
  it("gera 3 grupos de 4 no formato aceito", () => {
    for (let i = 0; i < 50; i++) {
      expect(isCertificateCode(generateCertificateCode())).toBe(true);
    }
  });

  it("nao repete codigos em sequencia", () => {
    const codes = new Set(
      Array.from({ length: 200 }, () => generateCertificateCode()),
    );
    expect(codes.size).toBe(200);
  });

  it("nunca usa letras e numeros que se confundem", () => {
    const code = generateCertificateCode(() =>
      Uint8Array.from({ length: 12 }, (_, i) => i * 21),
    );
    expect(code).not.toMatch(/[IO01]/);
  });
});

describe("isCertificateCode / normalizeCertificateCode", () => {
  it("rejeita formatos errados", () => {
    expect(isCertificateCode("")).toBe(false);
    expect(isCertificateCode("ABCD-EFGH")).toBe(false);
    expect(isCertificateCode("ABCD-EFGH-JKLM-NPQR")).toBe(false);
    expect(isCertificateCode("ABCD-EFGH-JKL0")).toBe(false);
    expect(isCertificateCode("abcd-efgh-jklm")).toBe(false);
  });

  it("aceita minusculas e espacos depois de normalizar", () => {
    expect(
      isCertificateCode(normalizeCertificateCode(" abcd-efgh-jklm ")),
    ).toBe(true);
  });
});

describe("certificateValidationUrl", () => {
  it("monta o endereco sem barra duplicada", () => {
    expect(
      certificateValidationUrl("https://exemplo.com/", "ABCD-EFGH-JKLM"),
    ).toBe("https://exemplo.com/verificar/ABCD-EFGH-JKLM");
  });
  it("withoutProtocol tira o https para caber no rodape", () => {
    expect(withoutProtocol("https://exemplo.com/verificar/X")).toBe(
      "exemplo.com/verificar/X",
    );
  });
});
