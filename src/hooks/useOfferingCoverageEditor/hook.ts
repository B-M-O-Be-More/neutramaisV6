"use client";

import React from "react";

import { isPublicGeometry } from "@/functions/geoShapes";
import {
  coverageNetworkPointsOf,
  sameCoverageNetworkPoints,
  type CoverageNetworkPoint,
} from "@/functions/coverageNetworkPoints";
import { ApiError, ForbiddenError, NotFoundError } from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

import type {
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

function confirmErrorKey(error: unknown): string {
  if (error instanceof ForbiddenError) {
    return "SellerOfferCreate.publish.errors.coveragePermission";
  }
  // 422: versão de outra organização ou recorte fora da área do KMZ.
  if (error instanceof ApiError && error.status === 422) {
    return "SellerOfferCoverage.errors.invalid";
  }
  return "SellerOfferCoverage.errors.failed";
}

/**
 * Área de cobertura de uma oferta já criada (só nas categorias com KMZ). A
 * cobertura não segue o "Salvar alterações": "Confirmar cobertura" vincula
 * na hora com `PUT /productOffering/{id}/coverageVersion` — o
 * `coverageVersionId` é o `activeVersionId` do KMZ escolhido na listagem
 * (`/coverageFile`). Cobertura total vai sem `publicGeometry`; a editada
 * leva o polígono desenhado.
 *
 * As localidades de atendimento do formulário (`formPoints`) vão junto,
 * como `coverageNetworkPoints` (ponto + raio em metros).
 *
 * Com versão vinculada, o salvo vem da geo-api
 * (`GET /offerCoverage/{offeringId}`): com `publicGeometry`, a tela abre na
 * cobertura editada, com os polígonos marcados; sem ele, na área toda. Os
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
  // Sem vínculo, ou com o GET respondido, os pontos salvos são conhecidos.
  // Se o GET falhou, não dá para saber: lista vazia não vai no PUT, para não
  // apagar pontos que a tela não leu.
  const [pointsKnown, setPointsKnown] = React.useState(
    !offeringId || !initialVersionId,
  );
  // O seller já escolheu outra versão ou outro recorte: o salvo que chegar
  // depois não sobrescreve a escolha.
  const touchedRef = React.useRef(false);

  React.useEffect(() => {
    if (!offeringId || !initialVersionId) return;
    const controller = new AbortController();

    geoCoverageService
      .getOfferCoverage(offeringId, { signal: controller.signal })
      .then((coverage) => {
        const points = coverageNetworkPointsOf(coverage?.coverageNetworkPoints);
        setBoundPoints(points);
        setSavedPoints(points);
        setPointsKnown(true);
        if (touchedRef.current) return;
        // O polígono só vale sobre o KMZ que a oferta tem vinculado.
        if (
          coverage?.coverageVersionId === initialVersionId &&
          isPublicGeometry(coverage.publicGeometry)
        ) {
          setScopeState({
            mode: "custom",
            publicGeometry: coverage.publicGeometry,
          });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        // 404: sem vínculo na geo-api — vale a área toda, sem pontos.
        if (error instanceof NotFoundError) {
          setPointsKnown(true);
        } else {
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
    const sendPoints = pointsKnown || points.length > 0;
    try {
      await productCatalogService.bindCoverage(
        offeringId,
        versionId,
        scope.mode === "custom" ? scope.publicGeometry : null,
        sendPoints ? points : undefined,
      );
      setBoundVersionId(versionId);
      setScopeChanged(false);
      if (sendPoints) {
        setBoundPoints(points);
        setPointsKnown(true);
      }
      setNotice({
        tone: "success",
        messages: ["SellerOfferCoverage.confirmed"],
      });
    } catch (error) {
      setNotice({ tone: "error", messages: [confirmErrorKey(error)] });
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
