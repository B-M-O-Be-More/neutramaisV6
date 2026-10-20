import type { KycDocumentType } from "@/services/kyc.service";

/** Níveis que o usuário pode escolher na etapa de KYC do cadastro. */
export type KycTargetLevel = "basic" | "verified" | "complete";

export const KYC_TARGET_LEVELS: KycTargetLevel[] = [
  "basic",
  "verified",
  "complete",
];

export interface KycDocumentItem {
  type: KycDocumentType;
  optional?: boolean;
}

export interface KycDocumentGroup {
  /** Nível que os documentos do grupo comprovam (`kyc_level_supported`). */
  level: KycTargetLevel;
  documents: KycDocumentItem[];
}

/**
 * Documentos por nível (Figma 1920-18413). O cartão CNPJ é a verificação do
 * nível básico e vai em qualquer envio; o verificado soma o grupo "KYC
 * Verificado"; o completo soma também o grupo "KYC Completo".
 *
 * O Figma lista também "Declaração de beneficiários finais" e "Certidão
 * negativa de débitos federais" no completo, mas a identity-api ainda não tem
 * `document_type` para eles — entram aqui quando o backend os aceitar.
 */
export const KYC_DOCUMENT_GROUPS: KycDocumentGroup[] = [
  {
    level: "basic",
    documents: [{ type: "cnpj_card" }],
  },
  {
    level: "verified",
    documents: [
      { type: "scm_outorga", optional: true },
      { type: "bank_proof" },
      { type: "legal_rep_id" },
      { type: "articles_of_incorporation" },
      { type: "address_proof" },
    ],
  },
  {
    level: "complete",
    documents: [{ type: "revenue_proof" }, { type: "representative_selfie" }],
  },
];

/**
 * Grupos exibidos para o nível escolhido: os do próprio nível e os dos
 * níveis abaixo dele (o básico — cartão CNPJ — entra sempre).
 */
export function kycGroupsFor(level: KycTargetLevel): KycDocumentGroup[] {
  const upTo = KYC_TARGET_LEVELS.indexOf(level);
  return KYC_DOCUMENT_GROUPS.filter(
    (group) => KYC_TARGET_LEVELS.indexOf(group.level) <= upTo,
  );
}
