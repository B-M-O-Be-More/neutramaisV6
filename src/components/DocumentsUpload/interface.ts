export type DocumentTag = "basic" | "verified" | "complete";

export interface DocumentSlot {
  /** Identificador único do documento. */
  id: string;
  /** Título já traduzido. */
  title: string;
  /** Nível de KYC ao qual o documento pertence. */
  tag: DocumentTag;
}

export type DocumentUploadStatus = "pending" | "uploading" | "sent";

export interface DocumentUploadState {
  status: DocumentUploadStatus;
  progress: number;
  file?: File;
}

export interface DocumentsUploadProps {
  /** Documentos exigidos (definidos pelo formulário). */
  documents: DocumentSlot[];
  /** Sincroniza os arquivos já enviados (status "sent"). */
  onChange?: (files: File[]) => void;
}
