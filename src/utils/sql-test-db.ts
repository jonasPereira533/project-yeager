/// <reference types="node" />
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

let enginePromise: Promise<SqlJsStatic> | null = null;

function loadEngine(): Promise<SqlJsStatic> {
    if (!enginePromise) {
        const dist = path.dirname(require.resolve("sql.js/dist/sql-wasm.js"));
        enginePromise = initSqlJs({
            locateFile: (file: string) => path.join(dist, file),
        });
    }
    return enginePromise;
}

/** Abre um banco em memória com o setupSQL. Só para uso nos testes. */
export async function openTestDatabase(setupSQL: string): Promise<Database> {
    const SQL = await loadEngine();
    const db = new SQL.Database();
    db.run(setupSQL);
    return db;
}