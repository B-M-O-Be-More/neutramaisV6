// Service de KYC — declaração de artefatos e submissão do lote (SDD §12.2).
// Sem React e sem tratamento de erro: propaga AppError tipado para o hook.
// O browser fala com o BFF (`/api/*`), que anexa o Bearer do cookie httpOnly.

import { api } from "./api.client";

/**
 * `document_type` aceitos pela identity-api. Os nomes vêm do domínio
 * (kyc_constants) e NÃO são os ids usados hoje na UI antiga do FormRegisterSeller
 * (`socialContract`, `legalRep`...), que são invenções do front.
 */
export type KycDocumentType =
  | "cnpj_card"
  | "scm_outorga"
  | "articles_of_incorporation"
  | "legal_rep_id"
  | "bank_proof"
  | "address_proof"
  | "revenue_proof"
  | "representative_selfie"
  | "international_tax_doc";

export type KycLevelSupported = "basic" | "verified" | "complete";

export type KycState =
  | "pending"
  | "basic"
  | "verified"
  | "complete"
  | "pending_documents"
  | "rejected"
  | "suspended";

/**
 * Payload de `POST /organizations/{org_id}/kyc/artifacts`.
 *
 * ATENÇÃO: este endpoint NÃO recebe o arquivo — só o metadado. O binário precisa
 * já estar no S3 e `s3_reference` aponta para ele. A identity-api não expõe
 * (ainda) endpoint de upload nem de URL pré-assinada, então quem produz o
 * `s3_reference` é uma peça de backend que ainda não existe.
 */
export interface DeclareArtifactDto {
  document_type: KycDocumentType;
  kyc_level_supported: KycLevelSupported;
  /** Ex.: "s3://kyc/acme/cnpj.pdf" — vem do upload, não do front. */
  s3_reference: string;
  /** SHA-256 hex (64 chars) do conteúdo — ver functions/fileHash. */
  content_hash: string;
  mime_type: string;
}

/** Resposta de `POST /organizations/{org_id}/kyc/submit`. */
export interface KycSubmitResult {
  organization_id: string;
  kyc_state: KycState;
  kyc_level: KycLevelSupported | "pending";
}

/** Resposta de `GET /organizations/{org_id}/kyc/status`. */
export interface KycStatus {
  kyc_state: KycState;
  kyc_level: KycLevelSupported | "pending";
}

/**
 * Documentos exigidos para o nível `basic` (RN-200): cartão CNPJ mais UM entre
 * outorga SCM e contrato social. Além dos documentos, o nível também exige
 * e-mail E TELEFONE confirmados.
 */
export const BASIC_KYC_DOCUMENTS = {
  required: ["cnpj_card"] as const,
  /** Basta um destes. */
  oneOf: ["scm_outorga", "articles_of_incorporation"] as const,
};

/** Corpo de `POST /organizations/{org_id}/kyc/submit` com o lote de documentos. */
export interface SubmitKycDto {
  artifacts: DeclareArtifactDto[];
}

export const kycService = {
  /** Declara um documento já presente no S3. Exige sessão (kyc:submit). */
  declareArtifact: (orgId: string, data: DeclareArtifactDto) =>
    api.post<null>(`/organizations/${orgId}/kyc/artifacts`, data),

  /**
   * Envia a documentação para avaliação de completude — é ESTE o endpoint do
   * envio: os documentos vão todos juntos, num lote só, no mesmo formato de
   * artefato aceito pelo `/kyc/artifacts` (`document_type`,
   * `kyc_level_supported`, `s3_reference`, `content_hash`, `mime_type`).
   *
   * Sem `artifacts`, submete o que já estiver declarado na organização.
   *
   * Se os documentos de `basic` estiverem presentes, o nível avança na hora —
   * mas o `status` da organização permanece "pending" (RN-538).
   *
   * Falta de documento devolve 422 com `{ "missing": [...] }`, onde
   * "scm_outorga|articles_of_incorporation" indica alternativa, não dois itens.
   */
  submit: (orgId: string, artifacts?: DeclareArtifactDto[]) => {
    const body: SubmitKycDto | Record<string, never> = artifacts
      ? { artifacts }
      : {};
    return api.post<KycSubmitResult>(
      `/organizations/${orgId}/kyc/submit`,
      body,
    );
  },

  /** Estado e nível atuais. Exige sessão. */
  getStatus: (orgId: string) =>
    api.get<KycStatus>(`/organizations/${orgId}/kyc/status`),
};
