export type CaseLevel = "Iniciante" | "Intermediário" | "Avançado";

export const CASE_LEVELS = [
  "Iniciante",
  "Intermediário",
  "Avançado",
] as const satisfies readonly CaseLevel[];

export interface Objective {
  id: string;
  xp: number;
  question: string;
  hint: string;
  refSQL: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  level: CaseLevel;
  category: string;
  tables: string;
  context: string;
  setupSQL: string;
  objectives: Objective[];
}

export interface SchemaColumn {
  name: string;
  type: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export type FeedbackType = "none" | "solved" | "open" | "error";

export interface Feedback {
  type: FeedbackType;
  message: string;
  /** Linha de apoio exibida sob o carimbo, explicando a falha da comparacao. */
  detail?: string;
}

export interface QueryResult {
  columns: string[];
  values: unknown[][];
}
