import type { KmzUploadResult } from "@/hooks/useKmzUpload";

export interface CoverageVersionUploadProps {
  /** Organização dona do arquivo. */
  organizationId: string | null;
  /** Versão ativa: a nova a substitui no mesmo arquivo lógico. */
  predecessorId: string | null;
  /** Só o Dono sobe KMZ (e arquivo arquivado não aceita versões). */
  canUpload: boolean;
  /** Idioma do tamanho do arquivo (ex.: "pt-BR"). */
  locale: string;
  onUploaded: (result: Extract<KmzUploadResult, { ok: true }>) => void;
}
