import type { Database, QueryExecResult } from "sql.js";
import type { QueryResult } from "../types/case";

export interface NormalizedResult {
  columns: string[];
  rows: unknown[][];
}

export type MismatchReason =
  | "no-result"
  | "row-count"
  | "column-count"
  | "values";

export type CompareOutcome =
  | { match: true }
  | { match: false; reason: MismatchReason; detail: string };

const NUMBER_EPSILON = 1e-6;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const WHITESPACE = /\s+/g;

const NO_RESULT: CompareOutcome = {
  match: false,
  reason: "no-result",
  detail: "A consulta nao devolveu um resultado pra comparar.",
};

function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLocaleLowerCase("pt-BR")
    .replace(WHITESPACE, " ")
    .trim();
}

function asNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCell(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "bigint") return Number(value);

  if (typeof value === "boolean" || typeof value === "object") {
    return foldText(String(value));
  }

  const text = foldText(String(value));
  if (!text) return null;

  const numeric = asNumber(text);
  return numeric === null ? text : numeric;
}

function numbersEqual(a: number, b: number): boolean {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= NUMBER_EPSILON * scale;
}

function cellsEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    return numbersEqual(a, b);
  }
  return a === b;
}

function rowsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;

  const used = new Array<boolean>(b.length).fill(false);

  for (const cell of a) {
    let paired = false;
    for (let j = 0; j < b.length; j++) {
      if (used[j]) continue;
      if (cellsEqual(cell, b[j])) {
        used[j] = true;
        paired = true;
        break;
      }
    }
    if (!paired) return false;
  }

  return true;
}

export function normalizeResult(result: QueryExecResult): NormalizedResult {
  return {
    columns: result.columns,
    rows: result.values.map((row) => row.map(normalizeCell)),
  };
}

export function normalizeExecResults(
  exec: QueryExecResult[],
): NormalizedResult[] {
  return exec.map(normalizeResult);
}

function widthOf(rows: unknown[][]): number {
  return rows.length ? rows[0].length : 0;
}

function rowCountDetail(user: number, ref: number): string {
  const plural = (n: number) => (n === 1 ? "linha" : "linhas");
  return `Sua consulta devolveu ${user} ${plural(
    user,
  )}. A resposta esperada tem ${ref} ${plural(ref)}.`;
}

function columnCountDetail(user: number, ref: number): string {
  return `Numero de colunas diferente: voce trouxe ${user}, o esperado e ${ref}.`;
}

export function compareRowSets(
  user: unknown[][],
  ref: unknown[][],
): CompareOutcome {
  if (user.length !== ref.length) {
    return {
      match: false,
      reason: "row-count",
      detail: rowCountDetail(user.length, ref.length),
    };
  }

  if (!user.length) return { match: true };

  const userWidth = widthOf(user);
  const refWidth = widthOf(ref);
  if (userWidth !== refWidth || user.some((row) => row.length !== userWidth)) {
    return {
      match: false,
      reason: "column-count",
      detail: columnCountDetail(userWidth, refWidth),
    };
  }

  const taken = new Array<boolean>(user.length).fill(false);

  for (const refRow of ref) {
    let matched = false;
    for (let i = 0; i < user.length; i++) {
      if (taken[i]) continue;
      if (rowsEqual(user[i], refRow)) {
        taken[i] = true;
        matched = true;
        break;
      }
    }
    if (!matched) {
      return {
        match: false,
        reason: "values",
        detail:
          "As linhas batem em quantidade, mas algum valor difere. Revisa filtros, joins e arredondamentos.",
      };
    }
  }

  return { match: true };
}

function compareAgainstRef(
  results: NormalizedResult[],
  ref: NormalizedResult,
): CompareOutcome {
  if (!results.length) return NO_RESULT;

  let fallback: CompareOutcome = NO_RESULT;

  for (const candidate of results) {
    const outcome = compareRowSets(candidate.rows, ref.rows);
    if (outcome.match) return outcome;
    if (
      fallback.match === false &&
      (outcome.reason === "values" || fallback.reason === "no-result")
    ) {
      fallback = outcome;
    }
  }

  return fallback;
}

export function matchesReference(
  exec: QueryExecResult[],
  db: Database,
  refSQL: string,
): CompareOutcome {
  let refExec: QueryExecResult[];
  try {
    refExec = db.exec(refSQL);
  } catch {
    refExec = [];
  }

  const ref = refExec.length
    ? normalizeResult(refExec[refExec.length - 1])
    : { columns: [], rows: [] };

  return compareAgainstRef(normalizeExecResults(exec), ref);
}

export function cleanColumnLabel(label: string, index: number): string {
  const cleaned = label
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || `col${index + 1}`;
}

export function toQueryResult(result: QueryExecResult[]): QueryResult | null {
  if (!result.length) return null;
  const last = result[result.length - 1];
  return {
    columns: last.columns.map(cleanColumnLabel),
    values: last.values,
  };
}