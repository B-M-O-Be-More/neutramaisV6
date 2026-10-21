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

/** Tamanho máximo de cada arquivo no `/kyc/artifacts` (10 MiB). */
export const KYC_MAX_FILE_BYTES = 10 * 1024 * 1024;

// Upload de até 10 MiB: o timeout padrão do cliente (30s) é curto demais.
const UPLOAD_TIMEOUT_MS = 120_000;

/**
 * Campos de `POST /organizations/{org_id}/kyc/artifacts`, enviados como
 * `multipart/form-data`. O backend lê e verifica os bytes do arquivo.
 */
export interface UploadKycArtifactDto {
  document_type: KycDocumentType;
  /** Metadado do documento; não concede nível à conta. */
  kyc_level_supported: KycLevelSupported;
  file: File;
}

/** Resposta (201) de `POST /organizations/{org_id}/kyc/artifacts`. */
export interface KycArtifact {
  /** Id do artefato confirmado — vai em `artifact_ids` do `/kyc/submit`. */
  id: string;
  organization_id: string;
  document_type: KycDocumentType;
  kyc_level_supported: KycLevelSupported;
  retain_until: string | null;
  content_hash_masked: string;
}

/** Corpo de `POST /organizations/{org_id}/kyc/submit`: ids dos artefatos. */
export interface SubmitKycDto {
  artifact_ids: string[];
}

/**
 * Resposta de `GET /organizations/{org_id}/kyc/status` e do `/kyc/submit`.
 * `kyc_level` é o nível já concedido; depois do envio, `kyc_state` fica
 * `pending_documents` até a decisão ser aplicada.
 */
export interface KycStatus {
  organization_id: string;
  kyc_state: KycState;
  kyc_level: KycLevelSupported;
}

export type KycSubmitResult = KycStatus;

export const kycService = {
  /** Envia UM arquivo e devolve o artefato confirmado. Exige `kyc:submit`. */
  uploadArtifact: (
    orgId: string,
    { document_type, kyc_level_supported, file }: UploadKycArtifactDto,
  ) => {
    // O backend aceita exatamente estes três campos.
    const form = new FormData();
    form.append("document_type", document_type);
    form.append("kyc_level_supported", kyc_level_supported);
    form.append("file", file);
    return api.post<KycArtifact>(
      `/organizations/${orgId}/kyc/artifacts`,
      form,
      {
        timeoutMs: UPLOAD_TIMEOUT_MS,
      },
    );
  },

  /**
   * Envia para análise a seleção de artefatos confirmados. O backend deduz o
   * nível pedido pelos tipos completos da seleção — documentos antigos não
   * entram sozinhos. Repetir a mesma seleção não duplica o envio. Exige
   * `kyc:submit`.
   */
  submit: (orgId: string, artifactIds: string[]) =>
    api.post<KycSubmitResult>(`/organizations/${orgId}/kyc/submit`, {
      artifact_ids: artifactIds,
    } satisfies SubmitKycDto),

  /** Estado e nível atuais. Exige sessão. */
  getStatus: (orgId: string) =>
    api.get<KycStatus>(`/organizations/${orgId}/kyc/status`),
};
