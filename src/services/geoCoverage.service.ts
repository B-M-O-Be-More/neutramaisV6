// Service das versões de cobertura (geo-api, KMZ).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/geo/*`), que anexa o Bearer do cookie.

import { api } from "./api.client";

/** Versão de cobertura como a geo-api devolve hoje (upload e `GET /{id}`). */
export interface CoverageVersion {
  id: string;
  organizationId: string;
  /** Versão anterior da mesma linhagem, quando informada no upload. */
  predecessorId: string | null;
  sourceSha256: string;
  createdAt: string;
  /** Arquivo lógico: as versões ligadas por `predecessorId` têm o mesmo. */
  logicalFileId: string;
  /** false em versões antigas, enviadas antes de a geo-api reter o KMZ. */
  originalAvailable: boolean;
  metadataAvailable: boolean;
}

/**
 * Versão como a tela a conhece: o que a geo-api devolve mais o que foi lido do
 * KMZ (no envio ou baixando o original). A geo-api não devolve a geometria nem
 * guarda o nome do arquivo.
 */
export interface CoverageVersionSummary extends CoverageVersion {
  fileName?: string;
  sizeBytes?: number;
  regionCount?: number;
  polygonCount?: number;
}

/**
 * Arquivo lógico de cobertura (`GET /coverageFile`): as versões ligadas por
 * `predecessorId`, com a versão ativa. Sem nome, data nem tamanho.
 */
export interface CoverageFile {
  fileId: string;
  activeVersionId: string;
  archived: boolean;
  revision: number;
}

export interface CoverageFilePage {
  items: CoverageFile[];
  total: number;
  offset: number;
  limit: number;
}

export interface ListCoverageFilesParams {
  offset?: number;
  /** 1 a 200 (padrão 50). */
  limit?: number;
  /** Só arquivos não arquivados. */
  activeOnly?: boolean;
}

/** Campos do `POST /coverageVersion/kmz` — o contrato não tem outros. */
export interface UploadKmzInput {
  organizationId: string;
  file: File;
  /** Versão que esta substitui (mesma organização). */
  predecessorId?: string;
}

export const geoCoverageService = {
  /**
   * Envia um KMZ e cria uma versão imutável. O mesmo arquivo de novo devolve
   * a versão existente. 422 com `detail` quando o KMZ é inválido, 409 quando
   * a cota de armazenamento da organização acabou e 429 quando outro KMZ
   * ainda está sendo importado.
   */
  uploadKmz: ({ organizationId, file, predecessorId }: UploadKmzInput) => {
    const form = new FormData();
    form.append("organization_id", organizationId);
    form.append("file", file, file.name);
    if (predecessorId) form.append("predecessor_id", predecessorId);
    return api.post<CoverageVersion>("/geo/coverageVersion/kmz", form, {
      // A geo-api importa o KMZ antes de responder: um arquivo grande leva
      // minutos (~4 min no "KMZ Geral" do benchmark). Espera o mesmo que o
      // gateway da geo-api (900 s).
      timeoutMs: 900_000,
    });
  },

  /** Metadados de uma versão (sem geometria). 404/403 fora da organização. */
  getVersion: (versionId: string, options: { signal?: AbortSignal } = {}) =>
    api.get<CoverageVersion>(
      `/geo/coverageVersion/${encodeURIComponent(versionId)}`,
      { signal: options.signal },
    ),

  /** Arquivos de cobertura da organização (uma página). */
  listFiles: (
    organizationId: string,
    { offset, limit, activeOnly }: ListCoverageFilesParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<CoverageFilePage>("/geo/coverageFile", {
      params: {
        organization_id: organizationId,
        offset,
        limit,
        active_only: activeOnly,
      },
      signal: options.signal,
    }),

  /**
   * KMZ original retido de um arquivo: a versão ativa ou `versionId`. 404
   * quando a versão é antiga e o original não foi guardado.
   */
  downloadOriginal: (
    fileId: string,
    organizationId: string,
    { versionId, signal }: { versionId?: string; signal?: AbortSignal } = {},
  ) =>
    api.getBlob(`/geo/coverageFile/${encodeURIComponent(fileId)}/download`, {
      params: { organization_id: organizationId, version_id: versionId },
      signal,
      // Dezenas de MB.
      timeoutMs: 300_000,
    }),
};
