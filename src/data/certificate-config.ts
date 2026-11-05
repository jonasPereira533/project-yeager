/**
 * Dados fixos do certificado. Tudo que a empresa/assinante precisa
 * trocar fica aqui, num arquivo só.
 */
export interface CertificateConfig {
  /** Carga horária complementar em horas. */
  hours: number;
  /** A carga horária por extenso, para não dar margem a rasura. */
  hoursInWords: string;
  /** Nome do treinamento, como aparece no texto. */
  courseName: string;
  /** Quem emite o certificado. */
  issuer: string;
  signerName: string;
  signerRole: string;
  /**
   * URL da imagem da assinatura (PNG com fundo transparente).
   * Sem imagem, o PDF usa o nome do assinante em itálico.
   */
  signatureUrl?: string;
}

export const CERTIFICATE_CONFIG: CertificateConfig = {
  hours: 10,
  hoursInWords: "dez",
  courseName: "Yeager — Laboratório de SQL",
  issuer: "JJ Informática", // TODO: confirmar emissor (JJ Informática ou VR Tech)
  signerName: "Jonas", // TODO: nome completo
  signerRole: "Desenvolvedor do projeto Yeager", // TODO: confirmar cargo
};
