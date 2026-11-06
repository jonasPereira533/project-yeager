// sem I, O, 0 e 1, que se confundem quando o codigo e digitado de um papel
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const CERTIFICATE_CODE_PATTERN =
  /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

function randomBytes(size: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size));
}

/** 12 caracteres em grupos de 4 (60 bits): nao da para adivinhar. */
export function generateCertificateCode(
  random: (size: number) => Uint8Array = randomBytes,
): string {
  const chars = Array.from(
    random(12),
    (byte) => ALPHABET[byte % ALPHABET.length],
  );
  return [
    chars.slice(0, 4).join(""),
    chars.slice(4, 8).join(""),
    chars.slice(8, 12).join(""),
  ].join("-");
}

export function normalizeCertificateCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isCertificateCode(value: string): boolean {
  return CERTIFICATE_CODE_PATTERN.test(value);
}

export function certificateValidationUrl(baseUrl: string, code: string) {
  return `${baseUrl.replace(/\/+$/, "")}/verificar/${code}`;
}

export function withoutProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
