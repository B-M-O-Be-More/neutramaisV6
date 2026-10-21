import type {
  KycDocumentType,
  KycLevelSupported,
} from "@/services/kyc.service";

/**
 * Estado de um documento na etapa de KYC do cadastro:
 * - `idle`      — nada enviado ainda
 * - `uploading` — `POST /kyc/artifacts` (multipart) em voo
 * - `sent`      — artefato confirmado; `artifactId` preenchido
 */
export type KycDocumentStatus = "idle" | "uploading" | "sent";

export interface KycDocumentState {
  status: KycDocumentStatus;
  /** `id` do artefato confirmado devolvido pelo `/kyc/artifacts`. */
  artifactId?: string;
  fileName?: string;
  /** Chave de tradução do último erro deste documento, ou undefined. */
  error?: string;
}

export interface UseKycDocumentsResult {
  /** Estado por tipo de documento (ausente = `idle`). */
  documents: Partial<Record<KycDocumentType, KycDocumentState>>;
  /** Ids de todos os artefatos confirmados nesta tela. */
  artifactIds: string[];
  /** Algum upload em voo. */
  uploading: boolean;
  /** `/kyc/submit` em voo. */
  submitting: boolean;
  /** Valida e envia o arquivo, guardando o id do artefato confirmado. */
  upload: (
    documentType: KycDocumentType,
    level: KycLevelSupported,
    file: File,
  ) => Promise<void>;
  /**
   * Envia para análise os artefatos dos tipos informados (os do nível
   * escolhido). Documentos de outros níveis ficam de fora: completos, eles
   * fariam o backend pedir um nível acima do escolhido.
   */
  submit: (documentTypes: KycDocumentType[]) => Promise<boolean>;
}
