import type { PublicGeometry } from "@/functions/geoShapes";
import type { CoverageNetworkPoint } from "@/functions/coverageNetworkPoints";
import type { CoverageScopeMode } from "@/schemas/sellerOffer";

/** Resultado do último "Confirmar cobertura" (chaves de tradução). */
export interface OfferingCoverageNotice {
  tone: "success" | "error";
  messages: string[];
}

/**
 * Localidades de atendimento do formulário, já como `coverageNetworkPoints`
 * (`locationsToCoverageNetworkPoints`). `invalid`: alguma tem ponto sem raio válido.
 */
export interface OfferingCoveragePoints {
  points: CoverageNetworkPoint[];
  invalid: boolean;
}

/** Recorte da cobertura: toda a área do KMZ ou o polígono desenhado. */
export interface OfferingCoverageScope {
  mode: CoverageScopeMode;
  publicGeometry: PublicGeometry | null;
}

export interface UseOfferingCoverageEditorReturn {
  /** Versão de KMZ escolhida (`activeVersionId` do arquivo); "" sem escolha. */
  versionId: string;
  /** Escolhe outra versão — o recorte volta para a área toda. */
  selectVersion: (versionId: string) => void;
  scope: OfferingCoverageScope;
  setScope: (scope: OfferingCoverageScope) => void;
  /** Versão vinculada à oferta no servidor (selo "vinculada" no seletor). */
  boundVersionId: string | null;
  /** Buscando o recorte salvo na geo-api (`GET /offerCoverage`). */
  isLoadingScope: boolean;
  /** Chave de tradução quando o recorte salvo não pôde ser lido. */
  scopeLoadError?: string;
  /**
   * Localidades salvas (`coverageNetworkPoints` do GET); null até chegarem. O
   * formulário as usa para preencher a lista.
   */
  savedPoints: CoverageNetworkPoint[] | null;
  /** Chave de tradução do erro do recorte (cobertura editada sem polígono). */
  scopeError?: string;
  /** Chave de tradução quando alguma localidade tem ponto sem raio válido. */
  pointsError?: string;
  /** Há mudança que ainda não foi vinculada. */
  isDirty: boolean;
  isConfirming: boolean;
  /** Pode confirmar: mudou, com versão, recorte válido e sem envio em curso. */
  canConfirm: boolean;
  notice: OfferingCoverageNotice | null;
  /** Vincula na hora (`PUT /productOffering/{id}/coverageVersion`). */
  confirm: () => Promise<void>;
}
