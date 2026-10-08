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
  level: Exclude<KycTargetLevel, "basic">;
  documents: KycDocumentItem[];
}

/**
 * Documentos por nível (Figma 1920-18413). O básico não exige documentos; o
 * verificado exige o primeiro grupo; o completo exige os dois.
 *
 * O Figma lista também "Declaração de beneficiários finais" e "Certidão
 * negativa de débitos federais" no completo, mas a identity-api ainda não tem
 * `document_type` para eles — entram aqui quando o backend os aceitar.
 */
export const KYC_DOCUMENT_GROUPS: KycDocumentGroup[] = [
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

/** Grupos exibidos para o nível escolhido. */
export function kycGroupsFor(level: KycTargetLevel): KycDocumentGroup[] {
  if (level === "basic") return [];
  if (level === "verified") {
    return KYC_DOCUMENT_GROUPS.filter((group) => group.level === "verified");
  }
  return KYC_DOCUMENT_GROUPS;
}
