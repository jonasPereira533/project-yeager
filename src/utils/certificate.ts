import type { CertificateConfig } from "../data/certificate-config";

export interface CertificateData {
  /** Nome de quem recebe o certificado. */
  name: string;
  casesCount: number;
  objectivesCount: number;
  totalXP: number;
  issuedAt: Date;
  /** Assinatura já carregada como data URL (PNG). Opcional. */
  signatureDataUrl?: string;
  /** Fonte cursiva do nome (TTF) em base64. Opcional. */
  nameFontBase64?: string;
}

type Rgb = [number, number, number];

const PAGE_W = 297;
const PAGE_H = 210;
const NAVY: Rgb = [11, 42, 94];
const GOLD: Rgb = [201, 169, 78];
const MUTED: Rgb = [70, 84, 112];
const SCRIPT_FONT = "GreatVibes";

export function formatIssueDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function certificateFileName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `certificado-yeager${slug ? `-${slug}` : ""}.pdf`;
}

export function certificateBody(
  data: CertificateData,
  config: CertificateConfig,
): string {
  return (
    `concluiu todos os ${data.casesCount} chamados (${data.objectivesCount} objetivos) ` +
    `do treinamento ${config.courseName}, acumulando ${data.totalXP} XP, ` +
    `com carga horária complementar de ${config.hours} (${config.hoursInWords}) horas. ` +
    `Emitido em ${formatIssueDate(data.issuedAt)} por ${config.issuer}.`
  ).toLocaleUpperCase("pt-BR");
}

/**
 * Monta o PDF (A4 paisagem). O jsPDF entra por import() dinamico:
 * so e baixado quando alguem realmente emite o certificado.
 */
export async function buildCertificate(
  data: CertificateData,
  config: CertificateConfig,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const cx = PAGE_W / 2;

  doc.setProperties({
    title: `Certificado Yeager - ${data.name}`,
    author: config.issuer,
    subject: config.courseName,
  });

  // ponto no canto superior esquerdo; com flip, o canto oposto (espelhado)
  const corner = (flip: boolean) => (x: number, y: number) =>
    flip ? ([PAGE_W - x, PAGE_H - y] as const) : ([x, y] as const);

  for (const flip of [false, true]) {
    const p = corner(flip);

    doc.setFillColor(...NAVY);
    doc.triangle(...p(0, 0), ...p(65, 0), ...p(0, 65), "F");

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(...p(46, 0), ...p(0, 46));
    doc.line(...p(51, 0), ...p(0, 51));

    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.9);
    doc.line(...p(81, 0), ...p(0, 81));
  }

  // moldura com dois cantos cortados na diagonal
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.9);
  doc.lines(
    [
      [214.4, 0],
      [0, 130.7],
      [-60.4, 59.9],
      [-214.4, 0],
      [0, -130.7],
      [60.4, -59.9],
    ],
    71.5,
    9.7,
    [1, 1],
    "S",
    true,
  );

  doc.setTextColor(...NAVY);
  doc.setFont("times", "normal");
  doc.setFontSize(58);
  doc.text("CERTIFICADO", cx, 52, { align: "center", charSpace: 0.6 });

  doc.setFontSize(12.5);
  doc.text("ESTE CERTIFICADO COMPROVA QUE", cx, 68, {
    align: "center",
    charSpace: 0.3,
  });

  // nome em cursiva, encolhido se for comprido demais para a pagina
  const name = data.name.trim();
  const hasScript = Boolean(data.nameFontBase64);
  if (data.nameFontBase64) {
    doc.addFileToVFS(`${SCRIPT_FONT}.ttf`, data.nameFontBase64);
    doc.addFont(`${SCRIPT_FONT}.ttf`, SCRIPT_FONT, "normal");
  }
  doc.setFont(
    hasScript ? SCRIPT_FONT : "times",
    hasScript ? "normal" : "bolditalic",
  );
  let nameSize = hasScript ? 48 : 34;
  doc.setFontSize(nameSize);
  while (nameSize > 18 && doc.getTextWidth(name) > 215) {
    nameSize -= 2;
    doc.setFontSize(nameSize);
  }
  doc.text(name, cx, 93, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(12.5);
  doc.text(certificateBody(data, config), cx, 111, {
    align: "center",
    maxWidth: 220,
    lineHeightFactor: 1.65,
    charSpace: 0.2,
  });

  // assinatura
  const lineY = 168;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(cx - 52, lineY, cx + 52, lineY);

  if (data.signatureDataUrl) {
    const props = doc.getImageProperties(data.signatureDataUrl);
    const width = 62;
    const height = (width * props.height) / props.width;
    doc.addImage(
      data.signatureDataUrl,
      "PNG",
      cx - width / 2,
      lineY - height + 3,
      width,
      height,
    );
  } else {
    doc.setTextColor(...NAVY);
    doc.setFont("times", "italic");
    doc.setFontSize(20);
    doc.text(config.signerName, cx, lineY - 3, { align: "center" });
  }

  doc.setTextColor(...NAVY);
  doc.setFont("times", "normal");
  doc.setFontSize(12.5);
  doc.text(config.signerName, cx, lineY + 7, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(config.signerRole, cx, lineY + 12.5, { align: "center" });

  return doc.output("blob");
}

async function loadAsDataUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined; // sem o arquivo, o PDF usa o visual alternativo
  }
}

export async function downloadCertificate(
  data: Omit<CertificateData, "signatureDataUrl" | "nameFontBase64">,
  config: CertificateConfig,
): Promise<void> {
  const [signatureDataUrl, fontDataUrl] = await Promise.all([
    loadAsDataUrl(config.signatureUrl),
    loadAsDataUrl(config.nameFontUrl),
  ]);
  const blob = await buildCertificate(
    {
      ...data,
      signatureDataUrl,
      nameFontBase64: fontDataUrl?.split(",")[1],
    },
    config,
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = certificateFileName(data.name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
