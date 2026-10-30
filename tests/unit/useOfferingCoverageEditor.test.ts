import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicGeometry } from "@/functions/geoShapes";
import { useOfferingCoverageEditor } from "@/hooks/useOfferingCoverageEditor";
import { ApiError, NotFoundError, ServerError } from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: { bindCoverage: vi.fn() },
}));

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: { getOfferCoverage: vi.fn() },
}));

const OFFERING_ID = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";
const BOUND = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";
const OTHER = "0193f1e2-9999-7c8d-9e0f-1a2b3c4d5e6f";

const POLYGON = {
  type: "Polygon",
  coordinates: [
    [
      [-38.5, -3.7],
      [-38.4, -3.7],
      [-38.4, -3.6],
      [-38.5, -3.7],
    ],
  ],
} as PublicGeometry;

const offering = (coverageVersionId: string | null) =>
  ({ id: OFFERING_ID, coverageVersionId }) as ProductOffering;

describe("useOfferingCoverageEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productCatalogService.bindCoverage).mockResolvedValue({
      offeringId: OFFERING_ID,
      coverageVersionId: BOUND,
    });
    // Padrão: vínculo com o KMZ inteiro.
    vi.mocked(geoCoverageService.getOfferCoverage).mockResolvedValue({
      offeringId: OFFERING_ID,
      coverageVersionId: BOUND,
      publicGeometry: null,
    });
  });

  it("abre com a versão vinculada, sem nada a confirmar", async () => {
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    expect(result.current.versionId).toBe(BOUND);
    expect(result.current.boundVersionId).toBe(BOUND);
    expect(result.current.isLoadingScope).toBe(true);
    await waitFor(() => expect(result.current.isLoadingScope).toBe(false));
    expect(geoCoverageService.getOfferCoverage).toHaveBeenCalledWith(
      OFFERING_ID,
      expect.anything(),
    );
    expect(result.current.scope.mode).toBe("full");
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canConfirm).toBe(false);
  });

  it("o recorte salvo na geo-api abre como cobertura editada", async () => {
    vi.mocked(geoCoverageService.getOfferCoverage).mockResolvedValue({
      offeringId: OFFERING_ID,
      coverageVersionId: BOUND,
      publicGeometry: POLYGON,
    });
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    await waitFor(() =>
      expect(result.current.scope).toEqual({
        mode: "custom",
        publicGeometry: POLYGON,
      }),
    );
    // Veio do servidor: não há nada a confirmar.
    expect(result.current.isDirty).toBe(false);
    expect(result.current.scopeLoadError).toBeUndefined();
  });

  it("ignora recorte de outra versão ou geometria inválida", async () => {
    vi.mocked(geoCoverageService.getOfferCoverage).mockResolvedValue({
      offeringId: OFFERING_ID,
      coverageVersionId: OTHER,
      publicGeometry: POLYGON,
    });
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    await waitFor(() => expect(result.current.isLoadingScope).toBe(false));
    expect(result.current.scope.mode).toBe("full");
  });

  it("não sobrescreve o que o seller escolheu antes da resposta", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(geoCoverageService.getOfferCoverage).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }) as never,
    );
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    act(() => result.current.selectVersion(OTHER));
    await act(async () =>
      resolve({
        offeringId: OFFERING_ID,
        coverageVersionId: BOUND,
        publicGeometry: POLYGON,
      }),
    );

    expect(result.current.versionId).toBe(OTHER);
    expect(result.current.scope.mode).toBe("full");
  });

  it("sem vínculo na geo-api (404), fica na área toda sem aviso", async () => {
    vi.mocked(geoCoverageService.getOfferCoverage).mockRejectedValue(
      new NotFoundError(404),
    );
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    await waitFor(() => expect(result.current.isLoadingScope).toBe(false));
    expect(result.current.scope.mode).toBe("full");
    expect(result.current.scopeLoadError).toBeUndefined();
  });

  it("falha ao ler o recorte vira aviso", async () => {
    vi.mocked(geoCoverageService.getOfferCoverage).mockRejectedValue(
      new ServerError(503),
    );
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    await waitFor(() =>
      expect(result.current.scopeLoadError).toBe(
        "SellerOfferCoverage.errors.scopeUnavailable",
      ),
    );
  });

  describe("localidades (coverageNetworkPoints)", () => {
    const SAVED = [
      { longitude: -46.655, latitude: -23.56, radiusMeters: 800 },
      { longitude: -46.635, latitude: -23.54, radiusMeters: 1500 },
    ];
    const NEW_POINT = { longitude: -38.5, latitude: -3.7, radiusMeters: 5000 };

    it("devolve os pontos salvos e não conta como mudança", async () => {
      vi.mocked(geoCoverageService.getOfferCoverage).mockResolvedValue({
        offeringId: OFFERING_ID,
        coverageVersionId: BOUND,
        publicGeometry: null,
        // Item inválido fica de fora.
        coverageNetworkPoints: [...SAVED, { longitude: 999 }],
      });
      const { result, rerender } = renderHook(
        ({ points }) =>
          useOfferingCoverageEditor(offering(BOUND), {
            points,
            invalid: false,
          }),
        { initialProps: { points: [] as typeof SAVED } },
      );

      await waitFor(() => expect(result.current.savedPoints).toEqual(SAVED));
      // O formulário preenche as localidades com os salvos.
      rerender({ points: SAVED });
      expect(result.current.isDirty).toBe(false);
    });

    it("localidade nova vira mudança e vai no PUT", async () => {
      const { result } = renderHook(() =>
        useOfferingCoverageEditor(offering(BOUND), {
          points: [NEW_POINT],
          invalid: false,
        }),
      );

      // Até o salvo chegar, confirmar mandaria a tela vazia.
      expect(result.current.canConfirm).toBe(false);
      await waitFor(() => expect(result.current.canConfirm).toBe(true));
      expect(result.current.isDirty).toBe(true);

      await act(() => result.current.confirm());

      expect(productCatalogService.bindCoverage).toHaveBeenCalledWith(
        OFFERING_ID,
        BOUND,
        null,
        [NEW_POINT],
      );
      expect(result.current.isDirty).toBe(false);
    });

    it("localidade com ponto e sem raio válido bloqueia o confirmar", async () => {
      const { result } = renderHook(() =>
        useOfferingCoverageEditor(offering(BOUND), {
          points: [],
          invalid: true,
        }),
      );

      await waitFor(() => expect(result.current.isLoadingScope).toBe(false));
      act(() => result.current.selectVersion(OTHER));

      expect(result.current.pointsError).toBe(
        "SellerOfferCoverage.errors.pointsInvalid",
      );
      expect(result.current.canConfirm).toBe(false);
    });

    it("sem ler os salvos, lista vazia não vai no PUT (não apaga)", async () => {
      vi.mocked(geoCoverageService.getOfferCoverage).mockRejectedValue(
        new ServerError(503),
      );
      const { result } = renderHook(() =>
        useOfferingCoverageEditor(offering(BOUND)),
      );

      await waitFor(() => expect(result.current.isLoadingScope).toBe(false));
      act(() => result.current.selectVersion(OTHER));
      await act(() => result.current.confirm());

      expect(productCatalogService.bindCoverage).toHaveBeenCalledWith(
        OFFERING_ID,
        OTHER,
        null,
        undefined,
      );
    });
  });

  it("sem versão vinculada, não consulta a geo-api", () => {
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(null)),
    );

    expect(result.current.isLoadingScope).toBe(false);
    expect(geoCoverageService.getOfferCoverage).not.toHaveBeenCalled();
  });

  it("cobertura manual exige o polígono e o envia no publicGeometry", async () => {
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );
    // Enquanto o salvo carrega, não confirma.
    await waitFor(() => expect(result.current.isLoadingScope).toBe(false));

    act(() =>
      result.current.setScope({ mode: "custom", publicGeometry: null }),
    );
    expect(result.current.scopeError).toBe(
      "SellerOfferCreate.errors.publicGeometryRequired",
    );
    expect(result.current.canConfirm).toBe(false);

    act(() =>
      result.current.setScope({ mode: "custom", publicGeometry: POLYGON }),
    );
    expect(result.current.canConfirm).toBe(true);

    await act(() => result.current.confirm());

    expect(productCatalogService.bindCoverage).toHaveBeenCalledWith(
      OFFERING_ID,
      BOUND,
      POLYGON,
      [],
    );
    expect(result.current.isDirty).toBe(false);
    expect(result.current.notice).toEqual({
      tone: "success",
      messages: ["SellerOfferCoverage.confirmed"],
    });
  });

  it("trocar de KMZ volta para a cobertura total", () => {
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(BOUND)),
    );

    act(() =>
      result.current.setScope({ mode: "custom", publicGeometry: POLYGON }),
    );
    act(() => result.current.selectVersion(OTHER));

    expect(result.current.scope).toEqual({
      mode: "full",
      publicGeometry: null,
    });
    expect(result.current.isDirty).toBe(true);
  });

  it("cobertura total vai sem polígono e passa a ser a vinculada", async () => {
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(null)),
    );

    act(() => result.current.selectVersion(OTHER));
    await act(() => result.current.confirm());

    expect(productCatalogService.bindCoverage).toHaveBeenCalledWith(
      OFFERING_ID,
      OTHER,
      null,
      [],
    );
    expect(result.current.boundVersionId).toBe(OTHER);
  });

  it.each([
    [new ApiError(422), "SellerOfferCoverage.errors.invalid"],
    [new ServerError(503), "SellerOfferCoverage.errors.failed"],
  ])("falha (%s) vira aviso e mantém a mudança", async (error, key) => {
    vi.mocked(productCatalogService.bindCoverage).mockRejectedValue(error);
    const { result } = renderHook(() =>
      useOfferingCoverageEditor(offering(null)),
    );

    act(() => result.current.selectVersion(OTHER));
    await act(() => result.current.confirm());

    expect(result.current.notice).toEqual({ tone: "error", messages: [key] });
    expect(result.current.boundVersionId).toBeNull();
    expect(result.current.canConfirm).toBe(true);
  });

  it("sem oferta (criação), não confirma", async () => {
    const { result } = renderHook(() => useOfferingCoverageEditor(null));

    act(() => result.current.selectVersion(OTHER));
    expect(result.current.canConfirm).toBe(false);
    await act(() => result.current.confirm());
    expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
  });
});
