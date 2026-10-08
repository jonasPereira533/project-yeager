import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

let enginePromise: Promise<SqlJsStatic> | null = null;

function loadEngine(): Promise<SqlJsStatic> {
  if (!enginePromise) {
    enginePromise = initSqlJs({
      locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
    });
  }
  return enginePromise;
}

export function useSqlEngine() {
  async function createDatabase(setupSQL: string): Promise<Database> {
    const SQL = await loadEngine();
    const db = new SQL.Database();
    db.run(setupSQL);
    return db;
  }

  return { createDatabase };
}
