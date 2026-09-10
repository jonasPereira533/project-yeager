import type { QueryExecResult } from "sql.js";
import type { QueryResult } from "../types/case";

export function normalizeExecResult(result: QueryExecResult[]): unknown[][] {
  if (!result.length) return [];
  const { values } = result[result.length - 1];
  return values.map((row) =>
    row.map((v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v)),
  );
}

export function rowSetsMatch(a: unknown[][], b: unknown[][]): boolean {
  if (a.length !== b.length) return false;
  const stringify = (rows: unknown[][]) =>
    rows.map((r) => JSON.stringify(r)).sort();
  const sa = stringify(a);
  const sb = stringify(b);
  return sa.every((v, i) => v === sb[i]);
}

export function toQueryResult(result: QueryExecResult[]): QueryResult | null {
  if (!result.length) return null;
  const last = result[result.length - 1];
  return { columns: last.columns, values: last.values };
}
