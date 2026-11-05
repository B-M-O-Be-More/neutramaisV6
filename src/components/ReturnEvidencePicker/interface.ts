/** JPG, PNG, PDF ou MP4 (Figma 2943-31794). */
export const RETURN_EVIDENCE_ACCEPT =
  "image/jpeg,image/png,application/pdf,video/mp4";

export const RETURN_EVIDENCE_MAX_FILES = 10;

export interface ReturnEvidencePickerProps {
  /** Id do input de arquivo (único na página). */
  id: string;
  files: File[];
  onChange: (files: File[]) => void;
  locale: string;
  disabled?: boolean;
  /** Mensagem já traduzida. */
  error?: string;
}
