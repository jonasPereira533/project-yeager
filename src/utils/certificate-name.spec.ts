import { beforeEach, describe, expect, it } from "vitest";
import {
  certificateNameKey,
  readSavedName,
  resolveName,
  writeSavedName,
} from "./certificate-name";

describe("certificateNameKey", () => {
  it("separa por usuario e usa guest para visitante", () => {
    expect(certificateNameKey("abc")).toBe("yeager:certificate-name:abc");
    expect(certificateNameKey(null)).toBe("yeager:certificate-name:guest");
    expect(certificateNameKey(undefined)).toBe("yeager:certificate-name:guest");
  });
});

describe("resolveName", () => {
  it("prefere o nome salvo ao do Google", () => {
    expect(resolveName("Maria Silva", "Maria S.")).toBe("Maria Silva");
  });
  it("cai no nome do Google sem nome salvo", () => {
    expect(resolveName("", " Maria S. ")).toBe("Maria S.");
  });
  it("devolve vazio sem nenhum dos dois", () => {
    expect(resolveName("  ", null)).toBe("");
  });
});

describe("readSavedName / writeSavedName", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as unknown as Storage;
  });

  it("guarda e le o nome sem espacos nas pontas", () => {
    writeSavedName("k", "  Maria Silva ");
    expect(readSavedName("k")).toBe("Maria Silva");
  });
  it("devolve vazio quando nao ha nada salvo", () => {
    expect(readSavedName("outra")).toBe("");
  });
});
