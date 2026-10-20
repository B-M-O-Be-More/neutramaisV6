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

/** Formatos aceitos no envio de documentos. */
export const KYC_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type KycMimeType = (typeof KYC_MIME_TYPES)[number];

export const KYC_MAX_BYTES = 10 * 1024 * 1024;

/** Metadados para autorizar o envio. Hash e referência são definidos no servidor. */
export interface UploadKycArtifactDto {
  document_type: KycDocumentType;
  kyc_level_supported: KycLevelSupported;
  mime_type: KycMimeType;
  size_bytes: number;
}

export interface KycUploadAuthorization {
  upload_id: string;
  upload: {
    url: string;
    fields: Record<string, string>;
    expires_at: string;
    max_bytes: number;
    content_type: KycMimeType;
  };
}

/**
 * Resposta da confirmação do upload. O id vem
 * como `artifact_id` no contrato combinado e como `id` no openapi da
 * identity-api — o front aceita os dois.
 */
export interface KycArtifact {
  artifact_id?: string;
  id?: string;
  document_type: KycDocumentType;
  kyc_level_supported: KycLevelSupported;
  content_hash: string;
  created_at: string;
}

/** Corpo de `POST /organizations/{org_id}/kyc/submit`: ids dos artefatos. */
export interface SubmitKycDto {
  artifact_ids: string[];
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
  /** Autoriza, envia os bytes e confirma UM documento. */
  uploadArtifact: async (
    orgId: string,
    data: UploadKycArtifactDto,
    file: File,
  ) => {
    const authorization = await api.post<KycUploadAuthorization>(
      `/organizations/${orgId}/kyc/uploads`,
      data,
    );
    const { upload, upload_id: uploadId } = authorization;
    if (
      !uploadId ||
      file.size > upload.max_bytes ||
      upload.content_type !== file.type ||
      Date.parse(upload.expires_at) <= Date.now()
    ) {
      throw new Error("KYC upload authorization invalid");
    }
    const body = new FormData();
    for (const [key, value] of Object.entries(upload.fields))
      body.append(key, value);
    body.append("file", file);
    const response = await fetch(upload.url, {
      method: "POST",
      credentials: "omit",
      body,
    });
    if (!response.ok) throw new Error("KYC upload failed");
    return api.post<KycArtifact>(
      `/organizations/${orgId}/kyc/uploads/${uploadId}/confirm`,
      {},
    );
  },

  /**
   * Envia para análise os artefatos já registrados, referenciados pelos
   * `artifact_id` devolvidos em `uploadArtifact`. Exige `kyc:submit`.
   */
  submit: (orgId: string, artifactIds: string[]) =>
    api.post<KycSubmitResult>(`/organizations/${orgId}/kyc/submit`, {
      artifact_ids: artifactIds,
    } satisfies SubmitKycDto),

  /** Estado e nível atuais. Exige sessão. */
  getStatus: (orgId: string) =>
    api.get<KycStatus>(`/organizations/${orgId}/kyc/status`),
};
