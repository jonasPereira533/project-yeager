import type { Database, QueryExecResult } from "sql.js";
import type { QueryResult } from "../types/case";

/**
 * Comparacao de resultados de consulta.
 *
 * As regras sao deliberadamente tolerantes: o jogador nao precisa reproduzir a
 * query de referencia, so precisa chegar no mesmo resultado.
 *
 * 1. A ordem das linhas nao importa.
 * 2. A ordem das colunas dentro da linha nao importa.
 * 3. Quantidade de colunas e de linhas precisa bater exatamente.
 * 4. Duplicatas contam (um GROUP BY que conta duas vezes reprova).
 * 5. Valores sao tolerantes: 10 == '10', 'Sao Paulo' == 'sao paulo',
 *    '' == NULL e numeros comparam com tolerancia de ponto flutuante.
 */

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

/**
 * Colapsa espacos, remove acentos e joga pra minusculas, para que
 * 'SÃO PAULO ' e 'sao  paulo' virem a mesma coisa.
 */
function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLocaleLowerCase("pt-BR")
    .replace(WHITESPACE, " ")
    .trim();
}

/** Reconhece '10', ' 10 ' e '1e2' como numero, mas nao 'P001' nem '10.5.3'. */
function asNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Forma canonica de um valor, usada so pra comparacao, nunca pra exibicao.
 * Numero vira number, texto vira texto normalizado e vazio vira null.
 */
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

/**
 * Dois valores da mesma posicao sao equivalentes quando normalizam igual ou
 * quando sao numeros dentro da tolerancia de ponto flutuante.
 */
function cellsEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    return numbersEqual(a, b);
  }
  return a === b;
}

/**
 * Duas linhas batem quando tem o mesmo tamanho e existe um jeito de casar
 * cada valor de uma com um valor da outra. Como a ordem das colunas nao
 * importa, procuramos o melhor emparelhamento guloso: datasets deste projeto
 * tem poucas linhas e poucas colunas, entao a busca e barata.
 */
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

/**
 * Normaliza todas as statements de uma execucao, nao so a ultima. Assim uma
 * instrucao de debug no fim da consulta nao invalida uma resposta correta.
 */
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

/**
 * Compara dois conjuntos de linhas ja normalizadas.
 * Multiconjunto: ordem ignora, duplicatas contam.
 */
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

  // Emparelhamento guloso: cada linha da referencia claims a primeira linha
  // ainda livre do jogador que bate com ela. Como linhas quase iguais sao
  // intercambiaveis, o primeiro encaixe nunca prejudica o resto.
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

/**
 * Tenta casar cada conjunto de resultados do jogador contra a referencia.
 * Guarda a primeira falha informative como fallback pra explicar o erro caso
 * nenhuma das tentativas passe.
 */
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

/**
 * Compara o resultado do jogador com o da query de referencia.
 * Qualquer conjunto de resultados da execucao do jogador serve, desde que bata
 * com a referencia.
 */
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

/**
 * Limpa o rotulo de uma coluna para exibicao.
 *
 * O SQLite usa o texto-fonte da expressao do SELECT como nome da coluna
 * quando nao ha alias, entao um comentario no meio da expressao vaza pro
 * cabecalho. Isso so afeta a apresentacao: a comparacao nunca le os nomes
 * das colunas.
 */
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