import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import {
  SQLite,
  SQLDialect,
  sql,
  schemaCompletionSource,
  type SQLNamespace,
} from "@codemirror/lang-sql";
import type { SchemaTable } from "../types/case";

/**
 * Espelha o que use-sql-codemirror monta. O composable depende de DOM
 * (onMounted), entao as funcoes puras sao replicadas aqui para testar o
 * formato do namespace e o comportamento do autocomplete sem browser.
 */
const SQLITE_DIALECT: SQLDialect = SQLDialect.define({
  ...SQLite.spec,
  caseInsensitiveIdentifiers: true,
});

function toSqlNamespace(schema: SchemaTable[]): Record<string, SQLNamespace> {
  const namespace: Record<string, SQLNamespace> = {};
  for (const table of schema) {
    namespace[table.name] = {
      self: { label: table.name, type: "class" },
      children: table.columns.map((c) => c.name),
    };
  }
  return namespace;
}

const SCHEMA: SchemaTable[] = [
  {
    name: "Cli_For",
    columns: [
      { name: "Nome", type: "TEXT" },
      { name: "Cidade", type: "TEXT" },
    ],
  },
  {
    name: "Movimento_Produto",
    columns: [
      { name: "Sequencia", type: "INTEGER" },
      { name: "Qtde", type: "REAL" },
    ],
  },
];

const NAMESPACE: Record<string, SQLNamespace> = toSqlNamespace(SCHEMA);

interface Option {
  label: string;
  type?: string;
  apply?: string;
}

function complete(doc: string): Option[] {
  const dialect = SQLITE_DIALECT;
  const extension = sql({ dialect, schema: NAMESPACE, upperCaseKeywords: true });
  const source = schemaCompletionSource({ dialect, schema: NAMESPACE });
  const state = EditorState.create({ doc, extensions: [extension] });
  const result = source(new CompletionContext(state, doc.length, true));
  if (!result || result instanceof Promise) return [];
  return result.options as Option[];
}

/** SQLNamespace e um union, entao o acesso por nome precisa de narrowing. */
function tableLevel(name: string): {
  self: { label: string; type?: string };
  children: unknown;
} {
  return NAMESPACE[name] as {
    self: { label: string; type?: string };
    children: unknown;
  };
}

describe("toSqlNamespace", () => {
  it("marca a tabela como class via self", () => {
    expect(tableLevel("Cli_For")).toEqual({
      self: { label: "Cli_For", type: "class" },
      children: ["Nome", "Cidade"],
    });
  });

  it("mantem children como array, nao objeto", () => {
    expect(Array.isArray(tableLevel("Cli_For").children)).toBe(true);
  });

  it("cobre todas as tabelas do esquema", () => {
    expect(Object.keys(NAMESPACE).sort()).toEqual([
      "Cli_For",
      "Movimento_Produto",
    ]);
  });

  it("nao usa o namespace quebrado Record<string, string[]>", () => {
    // O formato antigo fazia addNamespaceObject tratar o array como nivel
    // filho, entao o nome da tabela acabava tipado como `type`.
    expect(NAMESPACE).not.toHaveProperty("Cli_For.0");
  });
});

describe("autocomplete de tabelas", () => {
  it("complica tabela como class e sem crase", () => {
    const options = complete("SELECT * FROM");
    expect(options).toEqual([
      { label: "Cli_For", type: "class" },
      { label: "Movimento_Produto", type: "class" },
    ]);
  });

  it("nao embrulha o nome da tabela em crase nem aspas", () => {
    for (const option of complete("SELECT * FROM Cli_")) {
      expect(option.apply).toBeUndefined();
    }
  });
});

describe("autocomplete de colunas", () => {
  it("drill-down de dois niveis traz as colunas como property", () => {
    const options = complete("SELECT * FROM Cli_For.");
    expect(options.map((o) => o.label)).toEqual(["Nome", "Cidade"]);
    for (const option of options) {
      expect(option.type).toBe("property");
      expect(option.apply).toBeUndefined();
    }
  });

  it("drill-down funciona com nome de tabela com sufixo underscore", () => {
    const options = complete("SELECT * FROM Movimento_Produto.");
    expect(options.map((o) => o.label)).toEqual(["Sequencia", "Qtde"]);
    for (const option of options) {
      expect(option.type).toBe("property");
    }
  });

  it("nunca devolve coluna tipada como type", () => {
    for (const option of complete("SELECT * FROM Cli_For.")) {
      expect(option.type).not.toBe("type");
    }
  });
});

describe("dialeto case-insensitive", () => {
  it("o dialeto padrao do SQLite nao declara case-insensitive", () => {
    expect(SQLite.spec.caseInsensitiveIdentifiers).toBeFalsy();
    expect(SQLITE_DIALECT.spec.caseInsensitiveIdentifiers).toBe(true);
  });

  it("mantem as demais opcoes do dialeto do SQLite", () => {
    expect(SQLITE_DIALECT.spec.identifierQuotes).toBe(SQLite.spec.identifierQuotes);
  });

  it("sem case-insensitive as colunas voltariam com crase", () => {
    const source = schemaCompletionSource({
      dialect: SQLite,
      schema: NAMESPACE,
    });
    const extension = sql({ dialect: SQLite, schema: NAMESPACE });
    const state = EditorState.create({
      doc: "SELECT * FROM Cli_For.",
      extensions: [extension],
    });
    const result = source(new CompletionContext(state, state.doc.length, true));
    const options = (result && !(result instanceof Promise)
      ? result.options
      : []) as Option[];
    expect(options.some((o) => o.apply?.includes("`"))).toBe(true);
  });

  it("o formato antigo de namespace tipava a tabela como type", () => {
    const oldNamespace: SQLNamespace = { Cli_For: ["Nome", "Cidade"] };
    const source = schemaCompletionSource({
      dialect: SQLITE_DIALECT,
      schema: oldNamespace,
    });
    const extension = sql({ dialect: SQLITE_DIALECT, schema: oldNamespace });
    const state = EditorState.create({
      doc: "SELECT * FROM",
      extensions: [extension],
    });
    const result = source(new CompletionContext(state, state.doc.length, true));
    const options = (result && !(result instanceof Promise)
      ? result.options
      : []) as Option[];
    expect(options.map((o) => o.type)).toEqual(["type"]);
  });
});