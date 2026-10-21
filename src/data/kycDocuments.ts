import type {
  KycDocumentType,
  KycLevelSupported,
} from "@/services/kyc.service";

/** Níveis que a organização pode pedir na etapa de KYC. */
export type KycTargetLevel = "basic" | "verified" | "complete";

export const KYC_TARGET_LEVELS: KycTargetLevel[] = [
  "basic",
  "verified",
  "complete",
];

export interface KycDocumentItem {
  type: KycDocumentType;
  /**
   * Documentos com o mesmo `oneOf` são alternativas: basta enviar um deles
   * (ex.: contrato social ou outorga SCM).
   */
  oneOf?: string;
}

export interface KycDocumentGroup {
  /** Nível que os documentos do grupo comprovam (`kyc_level_supported`). */
  level: KycTargetLevel;
  documents: KycDocumentItem[];
}

/**
 * Documentos por nível, iguais para buyer e seller (contrato KYC do Identity):
 * - básico: cartão CNPJ + contrato social **ou** outorga SCM;
 * - verificado: + documento do representante e comprovante bancário;
 * - completo: + comprovantes de endereço e de receita e selfie do representante.
 *
 * O Figma lista também "Declaração de beneficiários finais" e "Certidão
 * negativa de débitos federais" no completo, mas a identity-api ainda não tem
 * `document_type` para eles — entram aqui quando o backend os aceitar.
 */
export const KYC_DOCUMENT_GROUPS: KycDocumentGroup[] = [
  {
    level: "basic",
    documents: [
      { type: "cnpj_card" },
      { type: "articles_of_incorporation", oneOf: "incorporation" },
      { type: "scm_outorga", oneOf: "incorporation" },
    ],
  },
  {
    level: "verified",
    documents: [{ type: "legal_rep_id" }, { type: "bank_proof" }],
  },
  {
    level: "complete",
    documents: [
      { type: "address_proof" },
      { type: "revenue_proof" },
      { type: "representative_selfie" },
    ],
  },
];

/**
 * Grupos exigidos para o nível escolhido: os do próprio nível e os dos níveis
 * abaixo dele. O `/kyc/submit` só considera a seleção enviada, então subir de
 * nível pede o conjunto inteiro de novo.
 */
export function kycGroupsFor(level: KycTargetLevel): KycDocumentGroup[] {
  const upTo = KYC_TARGET_LEVELS.indexOf(level);
  return KYC_DOCUMENT_GROUPS.filter(
    (group) => KYC_TARGET_LEVELS.indexOf(group.level) <= upTo,
  );
}

/**
 * Níveis que ainda podem ser pedidos: só acima do já concedido. Pedir o mesmo
 * nível ou um inferior é bloqueado pelo backend.
 */
export function kycSelectableLevels(
  current: KycLevelSupported = "pending",
): KycTargetLevel[] {
  if (current === "pending") return KYC_TARGET_LEVELS;
  const granted = KYC_TARGET_LEVELS.indexOf(current);
  return KYC_TARGET_LEVELS.filter((_, index) => index > granted);
}
