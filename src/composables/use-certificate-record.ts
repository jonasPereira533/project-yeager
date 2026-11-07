import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { generateCertificateCode } from "../utils/certificate-code";
import {
  parseCertificateRecord,
  type CertificateRecord,
} from "../utils/certificate-record";

export interface CertificateInput {
  uid: string;
  name: string;
  hours: number;
  cases: number;
  objectives: number;
  xp: number;
}

/** Busca um certificado pelo codigo. Devolve null se nao existir. */
export async function fetchCertificate(
  db: Firestore,
  code: string,
): Promise<CertificateRecord | null> {
  const snapshot = await getDoc(doc(db, "certificates", code));
  if (!snapshot.exists()) return null;
  return parseCertificateRecord(code, snapshot.data());
}

/**
 * Registra o certificado e devolve o registro. Se a pessoa ja emitiu um com
 * o mesmo nome, reaproveita: o codigo e a data impressos no papel nao mudam.
 */
export async function issueCertificate(
  db: Firestore,
  input: CertificateInput,
): Promise<CertificateRecord> {
  const existing = await getDocs(
    query(
      collection(db, "certificates"),
      where("uid", "==", input.uid),
      where("name", "==", input.name),
      limit(1),
    ),
  );
  const found = existing.docs[0];
  if (found) {
    const record = parseCertificateRecord(found.id, found.data());
    if (record) return record;
  }

  const code = generateCertificateCode();
  const ref = doc(db, "certificates", code);
  await setDoc(ref, { ...input, issuedAt: serverTimestamp() });

  const created = await getDoc(ref);
  const record = parseCertificateRecord(code, created.data());
  if (!record)
    throw new Error("Certificado gravado, mas nao foi possivel le-lo.");
  return record;
}
