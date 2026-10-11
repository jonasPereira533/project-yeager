import { describe, expect, it } from "vitest";
import initSqlJs, { type Database } from "sql.js";
import { createRequire } from "node:module";
import path from "node:path";
import { CASES } from "../data/cases";
import { matchesReference } from "./compare-results";

const require = createRequire(import.meta.url);

async function openCase(setupSQL: string): Promise<Database> {
  const dist = path.dirname(require.resolve("sql.js/dist/sql-wasm.js"));
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(dist, file),
  });
  const db = new SQL.Database();
  db.run(setupSQL);
  return db;
}

describe("referencias de todos os casos", () => {
  it.each(
    CASES.flatMap((c) =>
      c.objectives.map((o) => ({
        label: `${c.caseNumber}/${o.id}`,
        caseItem: c,
        objective: o,
      })),
    ),
  )("$label: a refSQL bate com o proprio resultado", async ({
    caseItem,
    objective,
  }) => {
    const db = await openCase(caseItem.setupSQL);
    const outcome = matchesReference(
      db.exec(objective.refSQL),
      db,
      objective.refSQL,
    );
    if (!outcome.match) {
      throw new Error(`refSQL nao casa consigo mesma: ${outcome.detail}`);
    }
    db.close();
  });

  it.each(
    CASES.flatMap((c) =>
      c.objectives.map((o) => ({
        label: `${c.caseNumber}/${o.id}`,
        caseItem: c,
        objective: o,
      })),
    ),
  )("$label: linhas embaralhadas continuam casando", async ({
    caseItem,
    objective,
  }) => {
    const db = await openCase(caseItem.setupSQL);
    const ref = db.exec(objective.refSQL);
    const expected = matchesReference(ref, db, objective.refSQL);
    expect(expected.match).toBe(true);

    const last = ref[ref.length - 1];
    const shuffled = [last].map((r) => ({
      ...r,
      values: [...r.values].reverse().map((row) => [...row].reverse()),
    }));

    const outcome = matchesReference(shuffled, db, objective.refSQL);
    expect(outcome.match).toBe(true);
    db.close();
  });
});