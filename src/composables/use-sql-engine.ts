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
  // O banco vive na memória do WASM: quem chama é dono do lifetime e precisa
  // fechar com db.close() — trocar de caso ou desmontar a view sem isso vaza.
  async function createDatabase(setupSQL: string): Promise<Database> {
    const SQL = await loadEngine();
    const db = new SQL.Database();
    db.run(setupSQL);
    return db;
  }

  return { createDatabase };
}
