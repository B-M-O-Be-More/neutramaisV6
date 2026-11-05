import type { KmzUploadPreview } from "@/services/geoCoverage.service";

/** KMZ escolhido e o consumo calculado pela prévia. */
export interface PendingKmzUpload {
  file: File;
  preview: KmzUploadPreview;
}

export interface KmzUploadConfirmDialogProps {
  /** Envio aguardando confirmação; null fecha o diálogo. */
  pending: PendingKmzUpload | null;
  isUploading: boolean;
  /** Locale dos números (ex.: "pt-BR"). */
  locale: string;
  onConfirm: () => void;
  onClose: () => void;
}
