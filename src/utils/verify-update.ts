import type { Database, QueryExecResult } from "sql.js";
import type { Case, Objective } from "../types/case";
import {
    compareRowSets,
    normalizeResult,
    type CompareOutcome,
    type MismatchReason,
} from "./compare-results";

type CreateDatabase = (setupSQL: string) => Promise<Database>;

interface ValidateUpdateParams {
    database: Database;
    caseItem: Case;
    objective: Objective;
    createDatabase: CreateDatabase;
}

const UPDATE_DETAIL: Record<MismatchReason, string> = {
    "no-result": "Não foi possível conferir os dados depois do seu comando.",
    "row-count":
        "A quantidade de linhas da tabela mudou. Aqui o comando só deve alterar valores, sem inserir nem apagar registros.",
    "column-count":
        "A estrutura dos dados mudou. Aqui o comando só deve alterar valores.",
    values:
        "Os dados finais não batem com o esperado: algum registro foi alterado a mais, a menos ou com valor errado. Revise o WHERE e as colunas do SET.",
};

function terminate(sql: string): string {
    return `${sql.trim().replace(/;+\s*$/, "")};`;
}

function lastRows(exec: QueryExecResult[]): unknown[][] | null {
    return exec.length ? normalizeResult(exec[exec.length - 1]).rows : null;
}

export function isUpdateObjective(objective: Objective): boolean {
    return objective.kind === "update";
}

export function caseHasUpdates(caseItem: Case): boolean {
    return caseItem.objectives.some(isUpdateObjective);
}

/**
 * Estado dos dados quando o objetivo começa: o setup do caso mais os
 * gabaritos dos UPDATEs dos objetivos anteriores. Sem UPDATE anterior,
 * devolve o setupSQL exatamente como está.
 */
export function initialStateSQL(caseItem: Case, objectiveId: string): string {
    const previous: string[] = [];
    for (const objective of caseItem.objectives) {
        if (objective.id === objectiveId) break;
        if (isUpdateObjective(objective)) previous.push(objective.refSQL);
    }
    if (!previous.length) return caseItem.setupSQL;
    return [caseItem.setupSQL, ...previous].map(terminate).join("\n");
}

export async function validateUpdate({
                                         database,
                                         caseItem,
                                         objective,
                                         createDatabase,
                                     }: ValidateUpdateParams): Promise<CompareOutcome> {
    const failure = (reason: MismatchReason): CompareOutcome => ({
        match: false,
        reason,
        detail: UPDATE_DETAIL[reason],
    });

    const verifySQL = objective.verifySQL;
    if (!verifySQL) return failure("no-result");

    let userRows: unknown[][] | null;
    try {
        userRows = lastRows(database.exec(verifySQL));
    } catch {
        return failure("no-result");
    }
    if (!userRows) return failure("no-result");

    const referenceSQL = [
        initialStateSQL(caseItem, objective.id),
        objective.refSQL,
    ]
        .map(terminate)
        .join("\n");

    let reference: Database | null = null;
    try {
        reference = await createDatabase(referenceSQL);
        const referenceRows = lastRows(reference.exec(verifySQL));
        if (!referenceRows) return failure("no-result");

        const outcome = compareRowSets(userRows, referenceRows);
        return outcome.match ? outcome : failure(outcome.reason);
    } catch {
        return failure("no-result");
    } finally {
        reference?.close();
    }
}