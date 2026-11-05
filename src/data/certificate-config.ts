
import signatureUrl from "../assets/assinatura.png";
import nameFontUrl from "../assets/fonts/great-vibes.ttf?url";
/**
  Dados do certificado
 */
export interface CertificateConfig {
  hours: number;
  hoursInWords: string;
  courseName: string;
  issuer: string;
  signerName: string;
  signerRole: string;
  signatureUrl?: string;
  nameFontUrl?: string;
  validationBaseUrl: string;
}

export const CERTIFICATE_CONFIG: CertificateConfig = {
  hours: 10,
  hoursInWords: "dez",
  courseName: "Yeager — Laboratório de SQL",
  issuer: "JJ Informática",
  signerName: "Jonas P. Silva e Juarez Goulart",
  signerRole: "Desenvolvedores do projeto Yeager",
  signatureUrl,
  nameFontUrl,
  validationBaseUrl: "https://project-yeager.vercel.app",
};
