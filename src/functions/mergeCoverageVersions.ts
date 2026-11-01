import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

/**
 * Lista de coberturas da tela: as enviadas nesta sessão (com nome, tamanho e
 * contagens lidos do arquivo) no lugar da mesma versão vinda da geo-api, e as
 * que a listagem ainda não trouxe no topo.
 */
export function mergeVersions(
  uploaded: { version: CoverageVersionSummary }[],
  listed: CoverageVersionSummary[],
): CoverageVersionSummary[] {
  const byId = new Map(uploaded.map(({ version }) => [version.id, version]));
  const listedIds = new Set(listed.map((version) => version.id));
  return [
    ...uploaded
      .map(({ version }) => version)
      .filter((version) => !listedIds.has(version.id)),
    ...listed.map((version) => byId.get(version.id) ?? version),
  ];
}
