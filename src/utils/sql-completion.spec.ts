import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import { ensureSyntaxTree } from "@codemirror/language";
import {
  SQLite,
  SQLDialect,
  sql,
  schemaCompletionSource,
  type SQLNamespace,
} from "@codemirror/lang-sql";
import type { SchemaTable } from "../types/case";
import {
  buildColumnOptions,
  createColumnCompletionSource,
  resolveTables,
} from "./sql-completion";

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

interface Option {
  label: string;
  type?: string;
  apply?: string;
  detail?: string;
}

function columnsAt(doc: string, explicit = false): Option[] {
  const state = EditorState.create({
    doc,
    extensions: [sql({ dialect: SQLITE_DIALECT, schema: toSqlNamespace(SCHEMA) })],
  });
  ensureSyntaxTree(state, doc.length, 5000);
  const result = createColumnCompletionSource(SCHEMA)(
    new CompletionContext(state, doc.length, explicit),
  );
  if (!result || result instanceof Promise) return [];
  return result.options as Option[];
}

function labelsAt(doc: string): string[] {
  return columnsAt(doc).map((o) => o.label);
}

describe("colunas no SELECT", () => {
  it("sem FROM nao ha coluna: nao existe tabela em escopo", () => {
    expect(labelsAt("SELECT ")).toEqual([]);
  });

  it("oferece coluna no WHERE da propria tabela", () => {
    expect(labelsAt("SELECT * FROM Cli_For WHERE ")).toEqual(["Nome", "Cidade"]);
  });

  it("mantem a coluna apta enquanto o usuario digita o prefixo", () => {
    const options = columnsAt("SELECT * FROM Cli_For WHERE No");
    expect(options.map((o) => o.label)).toEqual(["Nome", "Cidade"]);
  });

  it("devolve o from no comeco da palavra sendo digitada", () => {
    const doc = "SELECT * FROM Cli_For WHERE No";
    const state = EditorState.create({
      doc,
      extensions: [sql({ dialect: SQLITE_DIALECT, schema: toSqlNamespace(SCHEMA) })],
    });
    ensureSyntaxTree(state, doc.length, 5000);
    const result = createColumnCompletionSource(SCHEMA)(
      new CompletionContext(state, doc.length, false),
    );
    expect(result && !(result instanceof Promise) ? result.from : -1).toBe(
      doc.length - 2,
    );
  });
});

describe("escopo", () => {
  it("so oferece coluna de tabela que esta no FROM da frase", () => {
    expect(labelsAt("SELECT * FROM Movimento_Produto GROUP BY ")).not.toContain(
      "Cli_For.Nome",
    );
  });

  it("qualifica quando a frase tem mais de uma tabela", () => {
    expect(
      labelsAt(
        "SELECT * FROM Cli_For JOIN Movimento_Produto ON Cli_For.Nome = Movimento_Produto.Sequencia WHERE ",
      ),
    ).toEqual([
      "Cli_For.Nome",
      "Cli_For.Cidade",
      "Movimento_Produto.Sequencia",
      "Movimento_Produto.Qtde",
    ]);
  });

  it("qualificado insere o nome com o prefixo da tabela", () => {
    const options = columnsAt(
      "SELECT * FROM Cli_For JOIN Movimento_Produto ON Cli_For.Nome = Movimento_Produto.Sequencia WHERE ",
    );
    for (const option of options) {
      expect(option.apply).toBe(option.label);
      expect(option.detail).toBe(option.label.split(".")[0]);
    }
  });

  it("enxerga tabela com alias sem escopo duplicado", () => {
    expect(labelsAt("SELECT * FROM Cli_For AS c WHERE ")).toEqual([
      "Nome",
      "Cidade",
    ]);
  });

  it("pega as duas tabelas de um FROM separado por virgula", () => {
    expect(labelsAt("SELECT * FROM Cli_For, Movimento_Produto WHERE ")).toEqual([
      "Cli_For.Nome",
      "Cli_For.Cidade",
      "Movimento_Produto.Sequencia",
      "Movimento_Produto.Qtde",
    ]);
  });

  it("para na clausula seguinte e nao oferece coluna de outra frase", () => {
    const doc = "SELECT * FROM Cli_For; SELECT * FROM Movimento_Produto WHERE ";
    expect(labelsAt(doc)).not.toContain("Cli_For.Nome");
  });

  it("recusa tabela que nao existe no esquema", () => {
    expect(labelsAt("SELECT * FROM Tabela_Fantasma WHERE ")).toEqual([]);
  });

  it("resolve nome entre aspas", () => {
    expect(labelsAt('SELECT * FROM "Cli_For" WHERE ')).toEqual([
      "Nome",
      "Cidade",
    ]);
  });

  it("pega o ultimo pedaco de um nome qualificado por esquema", () => {
    expect(labelsAt("SELECT * FROM main.Cli_For WHERE ")).toEqual([
      "Nome",
      "Cidade",
    ]);
  });
});

describe("quando a fonte se cala", () => {
  it("depois do ponto quem responde e o lang-sql", () => {
    expect(columnsAt("SELECT * FROM Cli_For.")).toEqual([]);
    expect(columnsAt("SELECT * FROM Cli_For.No")).toEqual([]);
  });

  it("o lang-sql continua devolvendo a coluna crua no ponto", () => {
    const doc = "SELECT * FROM Cli_For.";
    const state = EditorState.create({
      doc,
      extensions: [sql({ dialect: SQLITE_DIALECT, schema: toSqlNamespace(SCHEMA) })],
    });
    ensureSyntaxTree(state, doc.length, 5000);
    const source = schemaCompletionSource({
      dialect: SQLITE_DIALECT,
      schema: toSqlNamespace(SCHEMA),
    });
    const result = source(new CompletionContext(state, doc.length, false));
    const options =
      result && !(result instanceof Promise) ? result.options : [];
    expect(options.map((o) => o.label)).toEqual(["Nome", "Cidade"]);
  });

  it("logo depois de FROM o que cabe e tabela", () => {
    expect(columnsAt("SELECT * FROM ")).toEqual([]);
    expect(columnsAt("SELECT * FROM Cli_For JOIN ")).toEqual([]);
  });

  it("dentro de aspas nao suge coluna", () => {
    expect(columnsAt("SELECT * FROM Cli_For WHERE Nome = 'Cli")).toEqual([]);
  });

  it("dentro de comentario nao suge coluna", () => {
    expect(columnsAt("SELECT * FROM Cli_For -- No")).toEqual([]);
  });
});

describe("resolveTables", () => {
  it("ignora repeticao", () => {
    const tables = resolveTables(SCHEMA, ["Cli_For", "cli_for", "Cli_For"]);
    expect(tables).toHaveLength(1);
  });

  it("casa sem diferenciar maiuscula", () => {
    expect(resolveTables(SCHEMA, ["CLI_FOR"])[0]?.name).toBe("Cli_For");
  });

  it("descarta o que nao esta no esquema", () => {
    expect(resolveTables(SCHEMA, ["Codigo", "Movimento_Produto"])).toHaveLength(1);
  });
});

describe("buildColumnOptions", () => {
  it("com uma tabela so o nome vai cru", () => {
    const options = buildColumnOptions([SCHEMA[0]]);
    expect(options.map((o) => o.label)).toEqual(["Nome", "Cidade"]);
    expect(options[0].apply).toBeUndefined();
  });

  it("varias tabelas prefixam tudo", () => {
    const options = buildColumnOptions(SCHEMA);
    expect(options.every((o) => o.label.includes("."))).toBe(true);
  });
});