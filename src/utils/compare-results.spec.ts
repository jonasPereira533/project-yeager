import { describe, expect, it } from "vitest";
import initSqlJs, { type Database } from "sql.js";
import { createRequire } from "node:module";
import path from "node:path";
import {
  cleanColumnLabel,
  compareRowSets,
  matchesReference,
  normalizeCell,
  toQueryResult,
} from "./compare-results";

/** compareRowSets recebe linhas ja normalizadas, entao normalizamos aqui. */
function match(user: unknown[][], ref: unknown[][]) {
  const norm = (rows: unknown[][]) => rows.map((row) => row.map(normalizeCell));
  return compareRowSets(norm(user), norm(ref));
}

describe("normalizeCell", () => {
  it("trata numero e texto numerico como o mesmo valor", () => {
    expect(normalizeCell(10)).toBe(10);
    expect(normalizeCell("10")).toBe(10);
    expect(normalizeCell(" 10 ")).toBe(10);
    expect(normalizeCell("1e2")).toBe(100);
  });

  it("mantem texto nao numerico como texto", () => {
    expect(normalizeCell("P001")).toBe("p001");
    expect(normalizeCell("10.5.3")).toBe("10.5.3");
  });

  it("normaliza acentos, caixa e espacos", () => {
    expect(normalizeCell("São Paulo")).toBe("sao paulo");
    expect(normalizeCell("SÃO PAULO")).toBe("sao paulo");
    expect(normalizeCell("  sao   paulo  ")).toBe("sao paulo");
  });

  it("colapsa vazio e nulo", () => {
    expect(normalizeCell("")).toBeNull();
    expect(normalizeCell("   ")).toBeNull();
    expect(normalizeCell(null)).toBeNull();
  });
});

describe("compareRowSets", () => {
  it("aceita resultados identicos", () => {
    expect(match([["a", 1]], [["a", 1]])).toEqual({ match: true });
  });

  it("ignora a ordem das linhas", () => {
    expect(
      match(
        [
          [1, "a"],
          [2, "b"],
        ],
        [
          [2, "b"],
          [1, "a"],
        ],
      ),
    ).toEqual({ match: true });
  });

  it("ignora a ordem das colunas dentro da linha", () => {
    expect(match([["a", 1]], [[1, "a"]])).toEqual({ match: true });
  });

  it("aceita numero contra texto numerico", () => {
    expect(match([[10, "SP"]], [["10", "sp"]])).toEqual({ match: true });
  });

  it("aceita diferencas de acento, caixa e espaco", () => {
    expect(match([["São Paulo"]], [[" sao  paulo "]])).toEqual({
      match: true,
    });
  });

  it("aceita vazio no lugar de nulo", () => {
    expect(match([[null, 1]], [["", 1]])).toEqual({ match: true });
  });

  it("aceita float com ruido de ponto flutuante", () => {
    expect(match([[68.6666666]], [[68.6667]])).toEqual({ match: true });
    expect(match([[0.1 + 0.2]], [[0.3]])).toEqual({ match: true });
  });

  it("reprova coluna a mais", () => {
    const outcome = match([["a", 1, "extra"]], [["a", 1]]);
    expect(outcome.match).toBe(false);
    expect(outcome.match === false && outcome.reason).toBe("column-count");
  });

  it("reprova coluna a menos", () => {
    const outcome = match([["a"]], [["a", 1]]);
    expect(outcome.match === false && outcome.reason).toBe("column-count");
  });

  it("reprova linha a mais", () => {
    const outcome = match(
      [
        [1],
        [2],
      ],
      [[1]],
    );
    expect(outcome.match === false && outcome.reason).toBe("row-count");
    expect(outcome.match === false && outcome.detail).toContain("2 linhas");
  });

  it("reprova quando um valor difere", () => {
    const outcome = match([[1], [2]], [[1], [3]]);
    expect(outcome.match === false && outcome.reason).toBe("values");
  });

  it("reprova duplicata que a referencia nao tem", () => {
    const outcome = match(
      [
        [1],
        [1],
      ],
      [[1]],
    );
    expect(outcome.match === false && outcome.reason).toBe("row-count");
  });

  it("cobra multiplicidade de linhas repetidas", () => {
    expect(match([[1], [1]], [[1], [1]])).toEqual({ match: true });
    expect(match([[1], [1]], [[1], [2]]).match).toBe(false);
  });

  it("aceita conjuntos vazios iguais", () => {
    expect(match([], [])).toEqual({ match: true });
  });
});

describe("cleanColumnLabel", () => {
  it("nao mexe em rotulo limpo", () => {
    expect(cleanColumnLabel("Sequencia", 0)).toBe("Sequencia");
    expect(cleanColumnLabel("COUNT(*)", 0)).toBe("COUNT(*)");
  });

  it("remove comentario de bloco no meio da expressao", () => {
    expect(cleanColumnLabel("Seq /* o id */ + 1", 0)).toBe("Seq + 1");
    expect(cleanColumnLabel("Seq + 1 /* soma */", 0)).toBe("Seq + 1");
    expect(cleanColumnLabel("COUNT(*) /* quantos */", 0)).toBe("COUNT(*)");
  });

  it("remove comentario de bloco multilinha", () => {
    expect(cleanColumnLabel("Seq /* linha1\n linha2 */", 0)).toBe("Seq");
  });

  it("remove comentario de linha", () => {
    expect(cleanColumnLabel("Seq -- o id", 0)).toBe("Seq");
    expect(cleanColumnLabel("Seq /* a */ -- b", 0)).toBe("Seq");
  });

  it("limpa expressao CASE com comentario", () => {
    expect(
      cleanColumnLabel("CASE WHEN Seq>0 /* ok */ THEN 1 ELSE 0 END", 0),
    ).toBe("CASE WHEN Seq>0 THEN 1 ELSE 0 END");
  });

  it("cai para colN quando o rotulo fica vazio", () => {
    expect(cleanColumnLabel("/* so comentario */", 0)).toBe("col1");
    expect(cleanColumnLabel("   ", 2)).toBe("col3");
  });
});

describe("toQueryResult", () => {
  it("limpa os cabecalhos vindos do SQLite", () => {
    const result = toQueryResult([
      {
        columns: ["Seq /* o id */ + 1", "Total", "/* nada */"],
        values: [[1, 2]],
      },
    ]);
    expect(result?.columns).toEqual(["Seq + 1", "Total", "col3"]);
    expect(result?.values).toEqual([[1, 2]]);
  });

  it("mantem os valores intactos", () => {
    const values = [["São Paulo", null, 89.9]];
    const result = toQueryResult([{ columns: ["Cidade", "X", "Y"], values }]);
    expect(result?.values).toBe(values);
  });

  it("devolve null sem resultado", () => {
    expect(toQueryResult([])).toBeNull();
  });
});

const SETUP = `
  CREATE TABLE Cliente (Codigo INTEGER, Nome TEXT, UF TEXT);
  INSERT INTO Cliente VALUES
    (1,'Ana Souza','SP'),
    (2,'Bruno Lima','SP'),
    (3,'Carla Reis','MG');
`;

async function makeDb(): Promise<Database> {
  const require = createRequire(import.meta.url);
  const dist = path.dirname(require.resolve("sql.js/dist/sql-wasm.js"));
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(dist, file),
  });
  const db = new SQL.Database();
  db.run(SETUP);
  return db;
}

describe("matchesReference", () => {
  it("aceita a query de referencia", async () => {
    const db = await makeDb();
    const ref = "SELECT Codigo, Nome FROM Cliente ORDER BY Codigo;";
    expect(matchesReference(db.exec(ref), db, ref)).toEqual({ match: true });
    db.close();
  });

  it("aceita o mesmo resultado escrito de outro jeito", async () => {
    const db = await makeDb();
    const ref = "SELECT Codigo, Nome FROM Cliente ORDER BY Codigo;";
    const alternative = "SELECT Nome, Codigo FROM Cliente;";
    expect(matchesReference(db.exec(alternative), db, ref)).toEqual({
      match: true,
    });
    db.close();
  });

  it("aceita quando o resultado nao e a ultima statement", async () => {
    const db = await makeDb();
    const ref = "SELECT COUNT(*) AS total FROM Cliente;";
    const user = `
      SELECT COUNT(*) AS total FROM Cliente;
      SELECT 1 AS debug;
    `;
    expect(matchesReference(db.exec(user), db, ref)).toEqual({ match: true });
    db.close();
  });

  it("reprova resultado incompleto", async () => {
    const db = await makeDb();
    const ref = "SELECT Codigo, Nome FROM Cliente ORDER BY Codigo;";
    const wrong = "SELECT Codigo FROM Cliente;";
    const outcome = matchesReference(db.exec(wrong), db, ref);
    expect(outcome.match).toBe(false);
    expect(outcome.match === false && outcome.reason).toBe("column-count");
    db.close();
  });

  it("nao quebra quando a referencia invalida", async () => {
    const db = await makeDb();
    const outcome = matchesReference(
      db.exec("SELECT Codigo FROM Cliente;"),
      db,
      "SELECT * FROM TabelaQueNaoExiste;",
    );
    expect(outcome.match).toBe(false);
    db.close();
  });
});