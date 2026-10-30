import type { CoverageVersion } from "@/services/geoCoverage.service";

export interface UseCoverageVersionReturn {
  /** Metadados da versão; null sem id, enquanto carrega ou em erro. */
  version: CoverageVersion | null;
  isLoading: boolean;
}
