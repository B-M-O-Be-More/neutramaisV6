// Service das versões de cobertura (geo-api, KMZ).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/geo/*`), que anexa o Bearer da sessão de
// perfil (cookie httpOnly). `organizationId` é o do contexto atual da
// identity-api (`GET /auth/context`), não o do /me. Um 401 renova a sessão de
// perfil uma vez e repete a chamada (`withProfileSession`).

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

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

export type CoverageFilePage = GeoPage<CoverageFile>;

export interface ListCoverageFilesParams {
  offset?: number;
  /** 1 a 200 (padrão 50). */
  limit?: number;
  /** Só arquivos não arquivados (sem ele, a lista inclui os arquivados). */
  activeOnly?: boolean;
  /** Deixa um arquivo fora da lista (ex.: candidatos a substituí-lo). */
  excludeFileId?: string;
}

/**
 * Ciclo de vida de um arquivo (`GET /coverageFile/{id}/preview`): os campos
 * da listagem mais os vínculos. Não traz o mapa.
 */
export interface CoverageFilePreview extends CoverageFile {
  /** Ofertas ligadas a alguma versão do arquivo. */
  linkedOfferCount: number;
  /** Hash do estado (versão ativa, arquivamento e vínculos). */
  previewRevision: string;
  /** Caminho da geo-api que lista os arquivos ativos que podem substituí-lo. */
  replacementsPath: string;
}

/** Versão no histórico de um arquivo, mais recente primeiro. */
export interface CoverageFileVersion {
  versionId: string;
  predecessorId: string | null;
  createdAt: string;
  sourceSha256: string;
}

/** Oferta ligada a um arquivo, com a versão vinculada. */
export interface CoverageFileOffer {
  offeringId: string;
  versionId: string;
  updatedAt: string;
}

/**
 * Cobertura vinculada a uma oferta (`GET /offerCoverage/{offeringId}`). A
 * geo-api devolve o `publicGeometry` como GeoJSON (null = o KMZ inteiro) e
 * os `coverageNetworkPoints` — localidades `{ longitude, latitude, radiusMeters }`.
 * Os dois chegam sem tipo garantido: quem lê confere.
 */
export interface OfferCoverage {
  offeringId: string;
  coverageVersionId: string;
  publicGeometry: unknown;
  coverageNetworkPoints?: unknown;
  /**
   * Escolha do seller, para reeditar (só para o seller): `areaIndexes` quando
   * vinculou por áreas do KMZ, `publicGeometry` quando desenhou.
   */
  publicSelection?: unknown;
}

/**
 * Placemark de uma versão (`GET /coverageVersion/{id}/elements`). Só os
 * campos que a tela usa; a geometria chega sem tipo garantido.
 */
export interface CoverageElement {
  placemarkIndex: number;
  name?: string | null;
  folderPath?: string[];
  geometry?: unknown;
  geometryKinds?: string[];
}

/** Página de placemarks: continua com `afterIndex` = `nextCursor`. */
export interface CoverageElementPage {
  items: CoverageElement[];
  hasMore: boolean;
  nextCursor: number | null;
}

export interface ListCoverageElementsParams {
  /** Último índice da página anterior (-1 para começar). */
  afterIndex?: number;
  /** 1 a 500 (padrão 100). */
  limit?: number;
  /** Simplificação visual em graus (0 a 1); 0 mantém os detalhes. */
  tolerance?: number;
}

/** Estado do arquivo depois de arquivar ou restaurar uma versão. */
export interface CoverageFileMutation {
  fileId: string;
  activeVersionId: string;
  archived: boolean;
  revision: number;
}

/**
 * Campos comuns das mudanças de ciclo de vida: o `previewRevision` lido no
 * preview (a geo-api recusa com 409 se o arquivo mudou desde então) e uma
 * chave de idempotência por comando.
 */
interface CoverageFileCommand {
  organizationId: string;
  expectedRevision: string;
  idempotencyKey: string;
}

export interface ArchiveCoverageFileInput extends CoverageFileCommand {
  /**
   * Arquivo ativo que recebe as ofertas vinculadas, com o `previewRevision`
   * dele. Obrigatório quando há ofertas no arquivo arquivado.
   */
  replacement?: { fileId: string; revision: string };
}

export interface RestoreCoverageVersionInput extends CoverageFileCommand {
  /** Versão retida do mesmo arquivo que passa a ser a ativa. */
  versionId: string;
  /** Leva as ofertas para a versão restaurada (padrão: ficam onde estão). */
  moveBindings?: boolean;
}

/** Página das listas da geo-api (`data.items`, `total`, `offset`, `limit`). */
export interface GeoPage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface GeoPageParams {
  offset?: number;
  /** 1 a 200 (padrão 50). */
  limit?: number;
}

/** Campos do `POST /coverageVersion/kmz` — o contrato não tem outros. */
export interface UploadKmzInput {
  organizationId: string;
  file: File;
  /** Versão que esta substitui (mesma organização). */
  predecessorId?: string;
}

/**
 * Prévia do consumo de um KMZ (`POST /coverageVersion/kmz/preview`). Não
 * reserva espaço: a cota pode mudar até o envio. MB = 1.000.000 bytes.
 */
export interface KmzUploadPreview {
  organizationId: string;
  fileSizeBytes: number;
  fileSizeMb: number;
  /** Espaço adicional da importação; zero se o arquivo já foi importado. */
  requiredBytes: number;
  requiredMb: number;
  currentUsageMb: number;
  quotaMb: number;
  availableMb: number;
  projectedUsageMb: number;
  availableAfterUploadMb: number;
  /** Quanto falta na cota; zero quando cabe. */
  shortfallMb: number;
  canUpload: boolean;
  /** O mesmo conteúdo (SHA-256) já existe na organização. */
  alreadyImported: boolean;
  requiresReindex: boolean;
  isReservation: boolean;
  breakdown: { originalsMb: number; geometriesMb: number; metadataMb: number };
}

/** Multipart do envio e da prévia de KMZ. */
function kmzForm({ organizationId, file, predecessorId }: UploadKmzInput) {
  const form = new FormData();
  form.append("organization_id", organizationId);
  form.append("file", file, file.name);
  if (predecessorId) form.append("predecessor_id", predecessorId);
  return form;
}

export const geoCoverageService = {
  /**
   * Envia um KMZ e cria uma versão imutável. O mesmo arquivo de novo devolve
   * a versão existente. 422 com `detail` quando o KMZ é inválido, 409 quando
   * a cota de armazenamento da organização acabou e 429 quando outro KMZ
   * ainda está sendo importado.
   */
  uploadKmz: (input: UploadKmzInput) =>
    withProfileSession(() =>
      api.post<CoverageVersion>("/geo/coverageVersion/kmz", kmzForm(input), {
        // A geo-api importa o KMZ antes de responder: um arquivo grande leva
        // minutos (~4 min no "KMZ Geral" do benchmark). Espera o mesmo que o
        // gateway da geo-api (900 s).
        timeoutMs: 900_000,
      }),
    ),

  /**
   * Calcula o consumo do KMZ na cota antes do envio, sem gravar nada. 200
   * também quando não cabe (`canUpload: false`); 422 com `detail` para KMZ
   * inválido; 429 enquanto outra importação roda. O mesmo arquivo segue
   * depois para `uploadKmz`.
   */
  previewKmz: (input: UploadKmzInput) =>
    withProfileSession(() =>
      api.post<KmzUploadPreview>(
        "/geo/coverageVersion/kmz/preview",
        kmzForm(input),
        // A prévia lê o arquivo inteiro: num KMZ grande, leva minutos.
        { timeoutMs: 900_000 },
      ),
    ),

  /** Metadados de uma versão (sem geometria). 404/403 fora da organização. */
  getVersion: (versionId: string, options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<CoverageVersion>(
        `/geo/coverageVersion/${encodeURIComponent(versionId)}`,
        { signal: options.signal },
      ),
    ),

  /**
   * Placemarks de uma versão (uma página), com geometria — as áreas que o
   * seller pode escolher para a oferta. 403 fora da organização.
   */
  listElements: (
    versionId: string,
    { afterIndex, limit, tolerance }: ListCoverageElementsParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<CoverageElementPage>(
        `/geo/coverageVersion/${encodeURIComponent(versionId)}/elements`,
        {
          params: { after_index: afterIndex, limit, tolerance },
          signal: options.signal,
        },
      ),
    ),

  /**
   * Cobertura vinculada à oferta, com o recorte público salvo. 404 quando a
   * oferta não tem vínculo na geo-api.
   */
  getOfferCoverage: (
    offeringId: string,
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<OfferCoverage>(
        `/geo/offerCoverage/${encodeURIComponent(offeringId)}`,
        { signal: options.signal },
      ),
    ),

  /**
   * Arquivos de cobertura da organização (uma página). Próxima página: offset
   * anterior + limit, até offset + recebidos chegar a `total`.
   */
  listFiles: (
    organizationId: string,
    { offset, limit, activeOnly, excludeFileId }: ListCoverageFilesParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<CoverageFilePage>("/geo/coverageFile", {
        params: {
          organization_id: organizationId,
          offset,
          limit,
          active_only: activeOnly,
          exclude_file_id: excludeFileId,
        },
        signal: options.signal,
      }),
    ),

  /** Vínculos e ciclo de vida de um arquivo (sem o mapa). */
  getFilePreview: (
    fileId: string,
    organizationId: string,
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<CoverageFilePreview>(
        `/geo/coverageFile/${encodeURIComponent(fileId)}/preview`,
        {
          params: { organization_id: organizationId },
          signal: options.signal,
        },
      ),
    ),

  /** Histórico de versões de um arquivo (uma página). */
  listFileVersions: (
    fileId: string,
    organizationId: string,
    { offset, limit }: GeoPageParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<GeoPage<CoverageFileVersion>>(
        `/geo/coverageFile/${encodeURIComponent(fileId)}/versions`,
        {
          params: { organization_id: organizationId, offset, limit },
          signal: options.signal,
        },
      ),
    ),

  /** Ofertas ligadas a um arquivo (uma página). */
  listFileOffers: (
    fileId: string,
    organizationId: string,
    { offset, limit }: GeoPageParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<GeoPage<CoverageFileOffer>>(
        `/geo/coverageFile/${encodeURIComponent(fileId)}/offers`,
        {
          params: { organization_id: organizationId, offset, limit },
          signal: options.signal,
        },
      ),
    ),

  /**
   * Arquiva o arquivo lógico (some da lista e não aceita novas ofertas nem
   * versões). Os bytes ficam retidos: não libera cota. Só o Dono.
   */
  archiveFile: (
    fileId: string,
    {
      organizationId,
      expectedRevision,
      idempotencyKey,
      replacement,
    }: ArchiveCoverageFileInput,
  ) =>
    withProfileSession(() =>
      api.post<CoverageFileMutation>(
        `/geo/coverageFile/${encodeURIComponent(fileId)}/archive`,
        {
          organization_id: organizationId,
          expectedRevision,
          idempotencyKey,
          ...(replacement
            ? {
                replacementFileId: replacement.fileId,
                replacementRevision: replacement.revision,
              }
            : {}),
        },
      ),
    ),

  /**
   * Torna ativa uma versão retida do mesmo arquivo, sem novo upload. Só o
   * Dono.
   */
  restoreVersion: (
    fileId: string,
    {
      organizationId,
      expectedRevision,
      idempotencyKey,
      versionId,
      moveBindings = false,
    }: RestoreCoverageVersionInput,
  ) =>
    withProfileSession(() =>
      api.post<CoverageFileMutation>(
        `/geo/coverageFile/${encodeURIComponent(fileId)}/restore`,
        {
          organization_id: organizationId,
          expectedRevision,
          idempotencyKey,
          versionId,
          moveBindings,
        },
      ),
    ),

  /**
   * KMZ original retido de um arquivo: a versão ativa ou `versionId`. 404
   * quando a versão é antiga e o original não foi guardado.
   */
  downloadOriginal: (
    fileId: string,
    organizationId: string,
    { versionId, signal }: { versionId?: string; signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.getBlob(`/geo/coverageFile/${encodeURIComponent(fileId)}/download`, {
        params: { organization_id: organizationId, version_id: versionId },
        signal,
        // Dezenas de MB.
        timeoutMs: 300_000,
      }),
    ),
};
