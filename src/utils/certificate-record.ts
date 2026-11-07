export interface CertificateRecord {
  code: string;
  name: string;
  hours: number;
  cases: number;
  objectives: number;
  xp: number;
  issuedAt: Date;
}

interface TimestampLike {
  toDate(): Date;
}

function isTimestamp(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TimestampLike).toDate === "function"
  );
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Le o documento do Firestore; devolve null se faltar algo ou vier torto. */
export function parseCertificateRecord(
  code: string,
  data: Record<string, unknown> | undefined,
): CertificateRecord | null {
  if (!data) return null;
  const { name, hours, cases, objectives, xp, issuedAt } = data;
  if (typeof name !== "string" || !name.trim()) return null;
  if (!isCount(hours) || !isCount(cases)) return null;
  if (!isCount(objectives) || !isCount(xp)) return null;
  if (!isTimestamp(issuedAt)) return null;

  return {
    code,
    name,
    hours,
    cases,
    objectives,
    xp,
    issuedAt: issuedAt.toDate(),
  };
}
