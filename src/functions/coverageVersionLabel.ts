import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

/**
 * Nome de exibição de uma versão de cobertura: o arquivo enviado ou o início
 * do id — a geo-api não guarda um nome para a versão.
 */
export function coverageVersionLabel(version: CoverageVersionSummary): string {
  if (version.fileName) return version.fileName;
  return `KMZ ${version.id.slice(0, 8)}`;
}
