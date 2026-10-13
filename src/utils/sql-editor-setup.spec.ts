import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { autocompletion } from "@codemirror/autocomplete";
import { buildAutocompleteExtension, setupExtensions } from "./sql-editor-setup";

function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const setupCode = codeOnly(
  readFileSync(resolve(import.meta.dirname, "sql-editor-setup.ts"), "utf8"),
);

const asList = (extension: unknown): unknown[] => extension as unknown[];

describe("fidelidade ao basicSetup", () => {
  it("perde exatamente uma entrada em relacao ao basicSetup instalado", () => {
    expect(setupExtensions.length + 1).toBe(asList(basicSetup).length);
  });

  it("nao importa basicSetup, que traria o autocomplete de volta", () => {
    expect(setupCode).not.toContain("basicSetup");
    expect(setupCode).not.toMatch(/from\s+"codemirror"/);
  });

  it("autocompletion() aparece so dentro do construtor do autocomplete", () => {
    const calls = setupCode.match(/autocompletion\(\)/g) ?? [];
    expect(calls).toHaveLength(1);
  });

  it("closeBrackets fica na lista, independente do autocomplete", () => {
    expect(setupCode).toContain("closeBrackets()");
    expect(setupCode).toContain("...closeBracketsKeymap");
  });
});

describe("buildAutocompleteExtension", () => {
  const pieceTypes = (extension: unknown) =>
    asList(extension).map(
      (piece) => (piece as { constructor: { name: string } }).constructor.name,
    );

  it("ligado devolve as mesmas pecas que o pacote devolve", () => {
    expect(pieceTypes(buildAutocompleteExtension(true))).toEqual(
      pieceTypes(autocompletion()),
    );
  });

  it("ligado traz campo de estado, plugin, config e keymap", () => {
    const names = pieceTypes(buildAutocompleteExtension(true));
    expect(names).toHaveLength(asList(autocompletion()).length);
    expect(names).toContain("StateField");
    expect(names).toContain("ViewPlugin");
    expect(names).toContain("PrecExtension");
  });

  it("desligado nao instala nada", () => {
    expect(buildAutocompleteExtension(false)).toEqual([]);
  });
});

describe("compartimento do autocomplete", () => {
  const DOC = "SELECT * FROM Cli_For";

  function mount() {
    const compartment = new Compartment();
    return {
      compartment,
      state: EditorState.create({
        doc: DOC,
        extensions: [
          setupExtensions,
          compartment.of(buildAutocompleteExtension(true)),
        ],
      }),
    };
  }

  it("monta dos dois lados sem erro", () => {
    const compartment = new Compartment();
    expect(() =>
      EditorState.create({
        doc: DOC,
        extensions: [
          setupExtensions,
          compartment.of(buildAutocompleteExtension(true)),
        ],
      }),
    ).not.toThrow();
    expect(() =>
      EditorState.create({
        doc: DOC,
        extensions: [
          setupExtensions,
          compartment.of(buildAutocompleteExtension(false)),
        ],
      }),
    ).not.toThrow();
  });

  it("desligar e religar nao mexe no documento nem na selecao", () => {
    const { compartment, state } = mount();

    const off = state.update({
      effects: compartment.reconfigure(buildAutocompleteExtension(false)),
    }).state;
    const onAgain = off.update({
      effects: compartment.reconfigure(buildAutocompleteExtension(true)),
    }).state;

    expect(off.doc.toString()).toBe(DOC);
    expect(onAgain.doc.toString()).toBe(DOC);
    expect(onAgain.selection.main.head).toBe(state.selection.main.head);
  });

  it("convive com o compartimento da linguagem, que e separado", () => {
    const autocompleteSlot = new Compartment();
    const languageSlot = new Compartment();
    const state = EditorState.create({
      doc: DOC,
      extensions: [
        setupExtensions,
        languageSlot.of([]),
        autocompleteSlot.of(buildAutocompleteExtension(true)),
      ],
    });

    const after = state.update({
      effects: [
        autocompleteSlot.reconfigure(buildAutocompleteExtension(false)),
        languageSlot.reconfigure([]),
      ],
    }).state;

    expect(after.doc.toString()).toBe(DOC);
    expect(() =>
      after.update({
        effects: languageSlot.reconfigure([]),
      }),
    ).not.toThrow();
  });
});