import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "sql.js";
import { CASES } from "../data/cases";
import { openTestDatabase } from "./sql-test-db";
import { initialStateSQL, isUpdateObjective } from "./verify-update";

const opened: Database[] = [];

afterEach(() => {
    while (opened.length) opened.pop()?.close();
});

async function open(sql: string): Promise<Database> {
    const db = await openTestDatabase(sql);
    opened.push(db);
    return db;
}

const updateObjectives = CASES.flatMap((caseItem) =>
    caseItem.objectives.filter(isUpdateObjective).map((objective) => ({
        label: `${caseItem.caseNumber}/${objective.id}`,
        caseItem,
        objective,
    })),
);

describe.each(updateObjectives)(
    "$label (UPDATE)",
    ({ caseItem, objective }) => {
        it("tem verifySQL", () => {
            expect(objective.verifySQL?.trim()).toBeTruthy();
        });

        it("o refSQL altera os dados e o verifySQL enxerga a diferença", async () => {
            const verify = objective.verifySQL as string;
            const db = await open(initialStateSQL(caseItem, objective.id));

            const before = JSON.stringify(db.exec(verify));
            db.run(objective.refSQL);
            const after = JSON.stringify(db.exec(verify));

            expect(after).not.toBe(before);
        });
    },
);