import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, parsePrefs, sanitizePrefs } from "./editor-prefs";

describe("padrao", () => {
  it("autocomplete vem ligado para quem nunca escolheu", () => {
    expect(DEFAULT_PREFS.autocomplete).toBe(true);
  });

  it("parse de ausencia devolve o padrao", () => {
    expect(parsePrefs(null)).toEqual({ autocomplete: true });
  });

  it("parse de string vazia devolve o padrao", () => {
    expect(parsePrefs("")).toEqual({ autocomplete: true });
  });
});

describe("entrada nao confiavel", () => {
  it("JSON invalido nao derruba o editor", () => {
    expect(parsePrefs("{isto nao e json")).toEqual({ autocomplete: true });
  });

  it("valor nao booleano volta ao padrao", () => {
    expect(parsePrefs('{"autocomplete":"false"}')).toEqual({
      autocomplete: true,
    });
    expect(parsePrefs('{"autocomplete":0}')).toEqual({ autocomplete: true });
    expect(parsePrefs('{"autocomplete":null}')).toEqual({ autocomplete: true });
  });

  it("array e objeto nao sao preferencias", () => {
    expect(sanitizePrefs([])).toEqual({ autocomplete: true });
    expect(sanitizePrefs(null)).toEqual({ autocomplete: true });
    expect(sanitizePrefs("ligado")).toEqual({ autocomplete: true });
  });

  it("chave desconhecida e ignorada, sem virar preferencia", () => {
    const prefs = sanitizePrefs({ autocomplete: false, tema: "claro" });
    expect(prefs).toEqual({ autocomplete: false });
    expect(prefs).not.toHaveProperty("tema");
  });
});

describe("round-trip", () => {
  it("desligado sobrevive a ida e volta pelo storage", () => {
    const prefs = sanitizePrefs({ autocomplete: false });
    expect(parsePrefs(JSON.stringify(prefs))).toEqual({ autocomplete: false });
  });

  it("ligado sobrevive a ida e volta pelo storage", () => {
    const prefs = sanitizePrefs({ autocomplete: true });
    expect(parsePrefs(JSON.stringify(prefs))).toEqual({ autocomplete: true });
  });
});