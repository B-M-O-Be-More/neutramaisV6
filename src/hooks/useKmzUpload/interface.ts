import type { CoverageGeoJson } from "@/components/CoverageMap";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

export type KmzUploadResult =
  | {
      ok: true;
      /** Versão criada, com nome do arquivo, tamanho e contagens lidos dele. */
      version: CoverageVersionSummary;
      /** Geometria lida no navegador, para o mapa; null se grande demais. */
      geometry: CoverageGeoJson | null;
    }
  | { ok: false; /** Chave de tradução do erro. */ errorKey: string };

/** Versão que o novo KMZ substitui (mesma organização). */
export interface KmzUploadOptions {
  predecessorId?: string;
}

export interface UseKmzUploadReturn {
  isUploading: boolean;
  /** Valida e lê o KMZ no navegador e então envia para a geo-api. */
  upload: (file: File, options?: KmzUploadOptions) => Promise<KmzUploadResult>;
}
