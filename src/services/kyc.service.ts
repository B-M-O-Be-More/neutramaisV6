// Service de KYC — registro de artefatos e submissão para análise (SDD §12.2).
// Sem React e sem tratamento de erro: propaga AppError tipado para o hook.
// O browser fala com o BFF (`/api/*`), que anexa o Bearer do cookie httpOnly.

import { api } from "./api.client";

/** `document_type` aceitos pela identity-api (kyc_constants do domínio). */
export type KycDocumentType =
  | "cnpj_card"
  | "scm_outorga"
  | "articles_of_incorporation"
  | "legal_rep_id"
  | "bank_proof"
  | "address_proof"
  | "revenue_proof"
  | "representative_selfie";

export type KycLevelSupported = "pending" | "basic" | "verified" | "complete";

export type KycState =
  | "pending"
  | "basic"
  | "verified"
  | "complete"
  | "pending_documents"
  | "under_review"
  | "rejected"
  | "suspended";

/** MIME whitelist do `/kyc/artifacts` (§14.4). */
export const KYC_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type KycMimeType = (typeof KYC_MIME_TYPES)[number];

/**
 * Payload de `POST /organizations/{org_id}/kyc/artifacts`.
 *
 * O endpoint recebe só o metadado: o binário deveria estar no S3 e
 * `s3_reference` apontar para ele. Enquanto não existe o upload para o S3, o
 * front manda o nome do arquivo nesse campo (limite de 512 caracteres).
 */
export interface UploadKycArtifactDto {
  document_type: KycDocumentType;
  kyc_level_supported: KycLevelSupported;
  s3_reference: string;
  /** SHA-256 hex (64 chars) do conteúdo — ver functions/fileHash. */
  content_hash: string;
  mime_type: KycMimeType;
}

/** Resposta (201) de `POST /organizations/{org_id}/kyc/artifacts`. */
export interface KycArtifact {
  artifact_id: string;
  document_type: KycDocumentType;
  kyc_level_supported: KycLevelSupported;
  content_hash: string;
  created_at: string;
}

/** Corpo de `POST /organizations/{org_id}/kyc/submit`: ids dos artefatos. */
export interface SubmitKycDto {
  artifacts: string[];
}

/** Resposta (200) de `POST /organizations/{org_id}/kyc/submit`. */
export interface KycSubmitResult {
  organization_id: string;
  kyc_state: KycState;
  submitted_at: string;
}

/** Resposta de `GET /organizations/{org_id}/kyc/status`. */
export interface KycStatus {
  kyc_state: KycState;
  kyc_level: KycLevelSupported;
}

export const kycService = {
  /** Registra UM documento e devolve o `artifact_id`. Exige `kyc:submit`. */
  uploadArtifact: (orgId: string, data: UploadKycArtifactDto) =>
    api.post<KycArtifact>(`/organizations/${orgId}/kyc/artifacts`, data),

  /**
   * Envia para análise os artefatos já registrados, referenciados pelos
   * `artifact_id` devolvidos em `uploadArtifact`. Exige `kyc:submit`.
   */
  submit: (orgId: string, artifactIds: string[]) =>
    api.post<KycSubmitResult>(`/organizations/${orgId}/kyc/submit`, {
      artifacts: artifactIds,
    } satisfies SubmitKycDto),

  /** Estado e nível atuais. Exige sessão. */
  getStatus: (orgId: string) =>
    api.get<KycStatus>(`/organizations/${orgId}/kyc/status`),
};
