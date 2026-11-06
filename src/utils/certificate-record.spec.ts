import { describe, expect, it } from "vitest";
import { parseCertificateRecord } from "./certificate-record";

const ISSUED = new Date(2026, 10, 5);
const valid = () => ({
  uid: "u1",
  name: "Maria da Silva",
  hours: 10,
  cases: 18,
  objectives: 53,
  xp: 1500,
  issuedAt: { toDate: () => ISSUED },
});

describe("parseCertificateRecord", () => {
  it("converte o documento do Firestore", () => {
    expect(parseCertificateRecord("ABCD-EFGH-JKLM", valid())).toEqual({
      code: "ABCD-EFGH-JKLM",
      name: "Maria da Silva",
      hours: 10,
      cases: 18,
      objectives: 53,
      xp: 1500,
      issuedAt: ISSUED,
    });
  });

  it("devolve null sem dados", () => {
    expect(parseCertificateRecord("X", undefined)).toBeNull();
  });

  it("devolve null quando falta campo ou vem com tipo errado", () => {
    expect(parseCertificateRecord("X", { ...valid(), name: "" })).toBeNull();
    expect(parseCertificateRecord("X", { ...valid(), hours: "10" })).toBeNull();
    expect(parseCertificateRecord("X", { ...valid(), issuedAt: 1 })).toBeNull();
    const { xp: _xp, ...withoutXp } = valid();
    expect(parseCertificateRecord("X", withoutXp)).toBeNull();
  });
});
