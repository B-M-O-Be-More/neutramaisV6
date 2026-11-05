"use client";

import React from "react";

import { savedAreaIndexesOf } from "@/functions/coverageAreas";
import { isPublicGeometry } from "@/functions/geoShapes";
import {
  savedCoverageNetworkPointsOf,
  sameCoverageNetworkPoints,
  type CoverageNetworkPoint,
} from "@/functions/coverageNetworkPoints";
import {
  ApiError,
  ForbiddenError,
  NotFoundError,
  upstreamDetailMessage,
} from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

import type {
  OfferingCoverageMessage,
  OfferingCoverageNotice,
  OfferingCoveragePoints,
  OfferingCoverageScope,
  UseOfferingCoverageEditorReturn,
} from "./interface";

const FULL_SCOPE: OfferingCoverageScope = {
  mode: "full",
  publicGeometry: null,
};

const NO_POINTS: CoverageNetworkPoint[] = [];
const NO_FORM_POINTS: OfferingCoveragePoints = {
  points: NO_POINTS,
  invalid: false,
};

// "Point -46.690459,-23.593702 is outside the coverage" (geo-api, via 422).
const POINT_OUTSIDE =
  /Point\s+(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s+is outside/i;

/**
 * Motivo da recusa. Com o ponto fora do KMZ, aponta a localidade (a API
 * devolve a coordenada; a posição sai dos pontos enviados).
 */
function confirmErrorMessage(
  error: unknown,
  points: readonly CoverageNetworkPoint[],
): OfferingCoverageMessage {
  if (error instanceof ForbiddenError) {
    return "SellerOfferCreate.publish.errors.coveragePermission";
  }
  if (error instanceof ApiError && error.status === 422) {
    const detail = upstreamDetailMessage(error) ?? "";
    const outside = detail.match(POINT_OUTSIDE);
    if (outside) {
      const [longitude, latitude] = [Number(outside[1]), Number(outside[2])];
      const index = points.findIndex(
        (point) =>
          Math.abs(point.longitude - longitude) < 1e-5 &&
          Math.abs(point.latitude - latitude) < 1e-5,
      );
      return index >= 0
        ? {
            key: "SellerOfferCoverage.errors.pointOutside",
            values: { number: index + 1 },
          }
        : "SellerOfferCoverage.errors.pointsOutside";
    }
    if (/do not overlap/i.test(detail)) {
      return "SellerOfferCoverage.errors.pointsOutside";
    }
    // Versão de outra organização ou recorte fora da área do KMZ.
    return "SellerOfferCoverage.errors.invalid";
  }
  return "SellerOfferCoverage.errors.failed";
}

/**
 * Área de cobertura de uma oferta já criada (só nas categorias com KMZ). A
 * cobertura não segue o "Salvar alterações": "Confirmar cobertura" vincula
 * na hora com `PUT /productOffering/{id}/coverageVersion` — o
 * `coverageVersionId` é o `activeVersionId` do KMZ escolhido na listagem
 * (`/coverageFile`). Cobertura total vai sem recorte; a editada leva o
 * polígono desenhado (`publicGeometry`) e a por áreas, os índices das áreas
 * escolhidas do KMZ (`coverageAreaIndexes`).
 *
 * As localidades de atendimento do formulário (`formPoints`) vão junto,
 * como `coverageNetworkPoints` (ponto + raio em metros).
 *
 * Com versão vinculada, o salvo vem da geo-api
 * (`GET /offerCoverage/{offeringId}`): com `publicSelection.areaIndexes`, a
 * tela abre nas áreas escolhidas; com `publicGeometry`, na cobertura
 * editada, com os polígonos marcados; sem eles, na área toda. Os
 * `coverageNetworkPoints` salvos voltam em `savedPoints`, para o formulário preencher
 * as localidades. Sem `offering` (criação), o hook fica sem uso.
 */
export function useOfferingCoverageEditor(
  offering: ProductOffering | null,
  formPoints: OfferingCoveragePoints = NO_FORM_POINTS,
): UseOfferingCoverageEditorReturn {
  const offeringId = offering?.id ?? "";
  const initialVersionId = offering?.coverageVersionId ?? null;
  const [boundVersionId, setBoundVersionId] = React.useState(initialVersionId);
  const [versionId, setVersionId] = React.useState(boundVersionId ?? "");
  const [scope, setScopeState] = React.useState(FULL_SCOPE);
  // O recorte foi mexido desde o último vínculo.
  const [scopeChanged, setScopeChanged] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [notice, setNotice] = React.useState<OfferingCoverageNotice | null>(
    null,
  );
  const [isLoadingScope, setIsLoadingScope] = React.useState(
    !!offeringId && !!initialVersionId,
  );
  const [scopeLoadError, setScopeLoadError] = React.useState<string>();
  // Pontos vinculados no servidor e os lidos do GET (para o formulário).
  const [boundPoints, setBoundPoints] = React.useState(NO_POINTS);
  const [savedPoints, setSavedPoints] = React.useState<
    CoverageNetworkPoint[] | null
  >(null);
  // O seller já escolheu outra versão ou outro recorte: o salvo que chegar
  // depois não sobrescreve a escolha.
  const touchedRef = React.useRef(false);

  React.useEffect(() => {
    if (!offeringId || !initialVersionId) return;
    const controller = new AbortController();

    geoCoverageService
      .getOfferCoverage(offeringId, { signal: controller.signal })
      .then((coverage) => {
        const points = savedCoverageNetworkPointsOf(coverage);
        setBoundPoints(points);
        setSavedPoints(points);
        if (touchedRef.current) return;
        // O recorte só vale sobre o KMZ que a oferta tem vinculado.
        if (coverage?.coverageVersionId !== initialVersionId) return;
        const geometry = isPublicGeometry(coverage.publicGeometry)
          ? coverage.publicGeometry
          : null;
        const areaIndexes = savedAreaIndexesOf(coverage.publicSelection);
        if (areaIndexes) {
          // O recorte salvo é a união das áreas: serve de prévia no mapa.
          setScopeState({
            mode: "areas",
            publicGeometry: geometry,
            areaIndexes,
          });
        } else if (geometry) {
          setScopeState({ mode: "custom", publicGeometry: geometry });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        // 404: sem vínculo na geo-api — vale a área toda, sem pontos.
        if (!(error instanceof NotFoundError)) {
          setScopeLoadError("SellerOfferCoverage.errors.scopeUnavailable");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingScope(false);
      });

    return () => controller.abort();
  }, [offeringId, initialVersionId]);

  const scopeError =
    scope.mode === "custom" && !scope.publicGeometry
      ? "SellerOfferCreate.errors.publicGeometryRequired"
      : scope.mode === "areas" && !scope.areaIndexes?.length
        ? "SellerOfferCreate.errors.coverageAreasRequired"
        : undefined;
  const pointsError = formPoints.invalid
    ? "SellerOfferCoverage.errors.pointsInvalid"
    : undefined;
  const pointsChanged = !sameCoverageNetworkPoints(
    formPoints.points,
    boundPoints,
  );
  const isDirty =
    !!versionId &&
    (versionId !== boundVersionId || scopeChanged || pointsChanged);
  // Enquanto o salvo carrega, confirmar mandaria a tela ainda vazia.
  const canConfirm =
    isDirty &&
    !scopeError &&
    !pointsError &&
    !isLoadingScope &&
    !isConfirming &&
    !!offeringId;

  const selectVersion = (next: string) => {
    touchedRef.current = true;
    // O polígono foi desenhado sobre a área do KMZ anterior.
    if (next !== versionId) {
      setScopeState(FULL_SCOPE);
      setScopeChanged(false);
    }
    setVersionId(next);
    setNotice(null);
  };

  const setScope = React.useCallback((next: OfferingCoverageScope) => {
    touchedRef.current = true;
    setScopeState(next);
    setScopeChanged(true);
    setNotice(null);
  }, []);

  const confirm = async () => {
    if (!canConfirm) return;
    setIsConfirming(true);
    setNotice(null);
    const points = formPoints.points;
    // A API aceita de 1 a 500 pontos: lista vazia é 422. Sem pontos, o campo
    // não vai e a oferta fica com o KMZ (ou o recorte) sem círculos.
    const sendPoints = points.length > 0;
    try {
      await productCatalogService.bindCoverage(offeringId, {
        coverageVersionId: versionId,
        publicGeometry: scope.mode === "custom" ? scope.publicGeometry : null,
        coverageAreaIndexes:
          scope.mode === "areas" ? scope.areaIndexes : undefined,
        coverageNetworkPoints: sendPoints ? points : undefined,
      });
      setBoundVersionId(versionId);
      setScopeChanged(false);
      // O PUT substitui o vínculo: sem pontos enviados, não fica nenhum.
      setBoundPoints(points);
      setNotice({
        tone: "success",
        messages: ["SellerOfferCoverage.confirmed"],
      });
    } catch (error) {
      setNotice({
        tone: "error",
        messages: [confirmErrorMessage(error, points)],
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    versionId,
    selectVersion,
    scope,
    setScope,
    boundVersionId,
    isLoadingScope,
    scopeLoadError,
    savedPoints,
    scopeError,
    pointsError,
    isDirty,
    isConfirming,
    canConfirm,
    notice,
    confirm,
  };
}
