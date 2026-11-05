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
}

const PAGE_W = 297;
const PAGE_H = 210;
const INK: [number, number, number] = [20, 23, 28];
const MUTED: [number, number, number] = [95, 101, 110];
const AMBER: [number, number, number] = [196, 130, 20];

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

  // moldura dupla
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, PAGE_W - 20, PAGE_H - 20);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.rect(14, 14, PAGE_W - 28, PAGE_H - 28);

  doc.setTextColor(...AMBER);
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text("YEAGER  /  FILA DE CHAMADOS", cx, 30, {
    align: "center",
    charSpace: 1.5,
  });

  doc.setTextColor(...INK);
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.text("CERTIFICADO DE CONCLUSÃO", cx, 52, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  doc.text("Certificamos que", cx, 70, { align: "center" });

  doc.setTextColor(...INK);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(30);
  const name = data.name.trim();
  doc.text(name, cx, 86, { align: "center", maxWidth: PAGE_W - 60 });
  const nameWidth = Math.min(doc.getTextWidth(name), PAGE_W - 60);
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.5);
  doc.line(cx - nameWidth / 2 - 6, 90, cx + nameWidth / 2 + 6, 90);

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  const body =
    `concluiu todos os ${data.casesCount} chamados (${data.objectivesCount} objetivos) ` +
    `do treinamento ${config.courseName}, resolvendo consultas SQL em casos de banco de dados, ` +
    `e acumulou ${data.totalXP} XP.`;
  doc.text(body, cx, 106, {
    align: "center",
    maxWidth: 210,
    lineHeightFactor: 1.5,
  });

  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text(
    `Carga horária complementar: ${config.hours} (${config.hoursInWords}) horas`,
    cx,
    128,
    { align: "center" },
  );

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(`Emitido em ${formatIssueDate(data.issuedAt)}.`, cx, 142, {
    align: "center",
  });

  // assinatura
  const lineY = 172;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(cx - 45, lineY, cx + 45, lineY);

  if (data.signatureDataUrl) {
    doc.addImage(data.signatureDataUrl, "PNG", cx - 25, lineY - 22, 50, 20);
  } else {
    doc.setTextColor(...INK);
    doc.setFont("times", "italic");
    doc.setFontSize(20);
    doc.text(config.signerName, cx, lineY - 4, { align: "center" });
  }

  doc.setTextColor(...INK);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text(config.signerName, cx, lineY + 6, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${config.signerRole} · ${config.issuer}`, cx, lineY + 11, {
    align: "center",
  });

  return doc.output("blob");
}

async function loadSignature(url: string | undefined) {
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
    return undefined; // sem imagem: o PDF cai no nome em italico
  }
}

export async function downloadCertificate(
  data: Omit<CertificateData, "signatureDataUrl">,
  config: CertificateConfig,
): Promise<void> {
  const signatureDataUrl = await loadSignature(config.signatureUrl);
  const blob = await buildCertificate({ ...data, signatureDataUrl }, config);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = certificateFileName(data.name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
