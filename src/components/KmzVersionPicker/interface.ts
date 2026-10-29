import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

export interface KmzVersionPickerProps {
  /** Versões da organização e as enviadas nesta sessão, mais recente primeiro. */
  versions: CoverageVersionSummary[];
  /** Carregando os KMZs da organização. */
  isLoadingList?: boolean;
  selectedId: string | null;
  /** Versão vinculada à oferta hoje (edição) — ganha o selo "Vinculada". */
  boundId?: string | null;
  onSelect: (versionId: string) => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
  /** Erro do último envio (já traduzido). */
  uploadError?: string;
  /** Erro de validação da etapa (já traduzido). */
  error?: string;
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
}
