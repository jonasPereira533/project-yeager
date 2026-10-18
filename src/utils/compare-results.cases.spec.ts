import { describe, expect, it } from "vitest";
import { CASES } from "../data/cases";
import { matchesReference } from "./compare-results";
import { openTestDatabase } from "./sql-test-db";

// Objetivos de UPDATE não devolvem linhas, então não há resultado para
// comparar com a própria referência. Eles são cobertos por update-cases.spec.ts.
const queryObjectives = CASES.flatMap((c) =>
    c.objectives
        .filter((o) => o.kind !== "update")
        .map((o) => ({
          label: `${c.caseNumber}/${o.id}`,
          caseItem: c,
          objective: o,
        })),
);

describe("referencias de todos os casos", () => {
  it.each(queryObjectives)(
      "$label: a refSQL bate com o proprio resultado",
      async ({ caseItem, objective }) => {
        const db = await openTestDatabase(caseItem.setupSQL);
        const outcome = matchesReference(
            db.exec(objective.refSQL),
            db,
            objective.refSQL,
        );
        if (!outcome.match) {
          throw new Error(`refSQL nao casa consigo mesma: ${outcome.detail}`);
        }
        db.close();
      },
  );

  it.each(queryObjectives)(
      "$label: linhas embaralhadas continuam casando",
      async ({ caseItem, objective }) => {
        const db = await openTestDatabase(caseItem.setupSQL);
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
      },
  );
});