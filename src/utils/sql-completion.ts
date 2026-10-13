import type { Completion, CompletionSource } from "@codemirror/autocomplete";
import type { EditorState, Text } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import type { SchemaTable } from "../types/case";

const FROM_KEYWORD = "from";
const JOIN_KEYWORD = "join";

const CLAUSE_END = new Set([
  "where",
  "group",
  "having",
  "order",
  "limit",
  "offset",
  "union",
  "intersect",
  "except",
  "returning",
  "window",
  "fetch",
]);

const WORD = /\w*/;

function unquote(raw: string): string {
  const first = raw[0];
  const last = raw[raw.length - 1];
  if ((first === '"' || first === "`" || first === "'") && last === first) {
    return raw.slice(1, -1);
  }
  if (first === "[" && last === "]") return raw.slice(1, -1);
  return raw;
}

export function tableNamesInStatement(
  doc: Text,
  statement: SyntaxNode,
): string[] {
  const names: string[] = [];
  let sawFrom = false;
  let expectTable = false;

  for (let node = statement.firstChild; node; node = node.nextSibling) {
    if (node.name === "Keyword") {
      const keyword = doc.sliceString(node.from, node.to).toLowerCase();
      if (keyword === FROM_KEYWORD) {
        sawFrom = true;
        expectTable = true;
        continue;
      }
      if (CLAUSE_END.has(keyword) && sawFrom) break;
      expectTable = sawFrom && keyword === JOIN_KEYWORD;
      continue;
    }

    if (
      node.name === "Punctuation" &&
      doc.sliceString(node.from, node.to) === ","
    ) {
      expectTable = sawFrom;
      continue;
    }

    if (node.name === "Identifier") {
      if (expectTable) names.push(doc.sliceString(node.from, node.to));
    } else if (node.name === "QuotedIdentifier") {
      if (expectTable) names.push(unquote(doc.sliceString(node.from, node.to)));
    } else if (node.name === "CompositeIdentifier") {
      const last = node.lastChild;
      if (expectTable && last && last.name === "Identifier") {
        names.push(doc.sliceString(last.from, last.to));
      }
    }

    expectTable = false;
  }

  return names;
}

export function resolveTables(
  schema: SchemaTable[],
  names: string[],
): SchemaTable[] {
  const byName = new Map<string, SchemaTable>();
  for (const table of schema) byName.set(table.name.toLowerCase(), table);

  const found: SchemaTable[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    const table = byName.get(key);
    if (table) {
      seen.add(key);
      found.push(table);
    }
  }
  return found;
}

export function buildColumnOptions(tables: SchemaTable[]): Completion[] {
  const qualified = tables.length > 1;
  return tables.flatMap((table) =>
    table.columns.map((column) => {
      const label = qualified ? `${table.name}.${column.name}` : column.name;
      return qualified
        ? { label, type: "property", apply: label, detail: table.name }
        : { label, type: "property" };
    }),
  );
}

function nodeBefore(state: EditorState, pos: number): SyntaxNode | null {
  const inner = syntaxTree(state).resolveInner(pos, -1);
  return inner.parent === null ? inner.childBefore(pos) : inner;
}

function statementAt(state: EditorState, pos: number): SyntaxNode | null {
  let node = nodeBefore(state, pos);
  while (node && node.name !== "Statement") node = node.parent;
  return node;
}

function insideLiteral(state: EditorState, pos: number): boolean {
  let node = nodeBefore(state, pos);
  while (node && node.name !== "Statement") {
    if (node.name === "String" || node.name === "Comment") return true;
    node = node.parent;
  }
  return false;
}

export function createColumnCompletionSource(
  schema: SchemaTable[],
): CompletionSource {
  return (context) => {
    const { state, pos } = context;
    const word = context.matchBefore(WORD);
    const from = word ? word.from : pos;

    if (state.sliceDoc(from - 1, from) === ".") return null;

    if (insideLiteral(state, pos)) return null;

    const previous = state
      .sliceDoc(0, from)
      .match(/([A-Za-z_]+)\s*$/)?.[1]
      ?.toLowerCase();
    if (previous === FROM_KEYWORD || previous === JOIN_KEYWORD) return null;

    const statement = statementAt(state, pos);
    if (!statement) return null;

    const tables = resolveTables(
      schema,
      tableNamesInStatement(state.doc, statement),
    );
    if (!tables.length) return null;

    return { from, options: buildColumnOptions(tables), validFor: WORD };
  };
}