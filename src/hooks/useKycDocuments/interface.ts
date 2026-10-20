import type {
  KycDocumentType,
  KycLevelSupported,
} from "@/services/kyc.service";

/**
 * Estado de um documento na etapa de KYC do cadastro:
 * - `idle`      — nada enviado ainda
 * - `uploading` — autorização, upload ou confirmação em voo
 * - `sent`      — artefato registrado; `artifactId` preenchido
 */
export type KycDocumentStatus = "idle" | "uploading" | "sent";

export interface KycDocumentState {
  status: KycDocumentStatus;
  /** Id do artefato confirmado pelo servidor. */
  artifactId?: string;
  fileName?: string;
  /** Chave de tradução do último erro deste documento, ou undefined. */
  error?: string;
}

export interface UseKycDocumentsResult {
  /** Estado por tipo de documento (ausente = `idle`). */
  documents: Partial<Record<KycDocumentType, KycDocumentState>>;
  /** Ids de todos os artefatos registrados — o corpo do `/kyc/submit`. */
  artifactIds: string[];
  /** Algum upload em voo. */
  uploading: boolean;
  /** `/kyc/submit` em voo. */
  submitting: boolean;
  /** Valida, envia os bytes e confirma o artefato. */
  upload: (
    documentType: KycDocumentType,
    level: KycLevelSupported,
    file: File,
  ) => Promise<void>;
  /** Envia os artefatos registrados para análise. */
  submit: () => Promise<boolean>;
}
