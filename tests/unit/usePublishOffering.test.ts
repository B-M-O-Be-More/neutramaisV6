import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePublishOffering } from "@/hooks/usePublishOffering";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import { ConflictError, ServerError } from "@/services/errors";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: {
    listSpecifications: vi.fn(),
    getCatalog: vi.fn(),
    createSpecification: vi.fn(),
    createOffering: vi.fn(),
    bindCoverage: vi.fn(),
    setPromotion: vi.fn(),
    transitionOffering: vi.fn(),
  },
}));

const OFFERING_ID = "33333333-3333-4333-8333-333333333333";

// Conectividade: precisa de cobertura (KMZ), que só entra depois de criar.
const VALUES: SellerOfferValues = {
  category: "connectivity",
  locations: [],
  coverageRegion: "",
  name: "Link Dedicado 1 Gbps",
  shortDescription: "Link simétrico com SLA",
  description: "x".repeat(60),
  speedValue: "1",
  speedUnit: "Gbps",
  maxLatency: "5",
  acceptanceSla: "48",
  technicalSla: "99,5",
  deliveryTime: "30 dias após o aceite",
  hardwareManufacturer: "",
  hardwareModel: "",
  hardwareCondition: "",
  hardwareWarranty: "",
  hardwareSerialization: "",
  numberingResourceType: "",
  numberingBlock: "",
  numberingHolder: "",
  productType: "",
  shippingWeightKg: "",
  shippingHeightCm: "",
  shippingWidthCm: "",
  shippingLengthCm: "",
  shippingOriginPostalCode: "",
  shippingInsuranceValue: "",
  pricingModel: "monthly",
  currency: "BRL",
  price: "1.890,00",
  setupFee: "",
  stock: "",
  cancellationTerms: "30 dias corridos",
  validUntil: "",
  sponsored: false,
};

// Software: sem cobertura, publica direto.
const SOFTWARE: SellerOfferValues = { ...VALUES, category: "software" };

const spec = (id: string, name: string) => ({
  id,
  organizationId: "org-1",
  catalogId: "cat-1",
  name,
  description: null,
  estimatedInstallationDays: null,
  capacity: null,
  isActive: true,
  createdAt: "",
  updatedAt: "",
});

describe("usePublishOffering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productCatalogService.listSpecifications).mockResolvedValue([
      spec("spec-connectivity", "Conectividade"),
      spec("spec-software", "Softwares e Gerenciamento"),
    ]);
    vi.mocked(productCatalogService.createOffering).mockResolvedValue({
      id: OFFERING_ID,
    } as ProductOffering);
  });

  it("categoria com KMZ: cria como rascunho, sem vincular nem publicar", async () => {
    const { result } = renderHook(() => usePublishOffering());

    let outcome;
    await act(async () => {
      outcome = await result.current.publish(VALUES);
    });

    expect(outcome).toEqual({
      status: "needsCoverage",
      offeringId: OFFERING_ID,
      warnings: [],
    });
    expect(productCatalogService.createOffering).toHaveBeenCalledTimes(1);
    expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
    expect(productCatalogService.transitionOffering).not.toHaveBeenCalled();
  });

  it("categoria com KMZ e patrocínio: aplica o patrocínio no rascunho", async () => {
    const { result } = renderHook(() => usePublishOffering());

    await act(async () => {
      await result.current.publish({ ...VALUES, sponsored: true });
    });

    expect(productCatalogService.setPromotion).toHaveBeenCalledWith(
      OFFERING_ID,
      true,
    );
    expect(productCatalogService.transitionOffering).not.toHaveBeenCalled();
  });

  it("categoria sem KMZ: cria e publica", async () => {
    const { result } = renderHook(() => usePublishOffering());

    let outcome;
    await act(async () => {
      outcome = await result.current.publish(SOFTWARE);
    });

    expect(outcome).toEqual({
      status: "published",
      offeringId: OFFERING_ID,
      warnings: [],
    });
    expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
    expect(productCatalogService.transitionOffering).toHaveBeenCalledWith(
      OFFERING_ID,
      "publish",
    );
  });

  it("se a publicação falha, fica rascunho e a nova tentativa publica sem recriar", async () => {
    vi.mocked(productCatalogService.transitionOffering)
      .mockRejectedValueOnce(new ServerError(503))
      .mockResolvedValueOnce(undefined as never);
    const { result } = renderHook(() => usePublishOffering());

    let first;
    await act(async () => {
      first = await result.current.publish(SOFTWARE);
    });
    expect(first).toMatchObject({
      status: "draft",
      offeringId: OFFERING_ID,
      reasonKey: "SellerOfferCreate.publish.errors.publishFailed",
    });
    expect(result.current.createdOfferingId).toBe(OFFERING_ID);

    let second;
    await act(async () => {
      second = await result.current.publish(SOFTWARE);
    });
    expect(second).toMatchObject({ status: "published" });
    expect(productCatalogService.createOffering).toHaveBeenCalledTimes(1);
  });

  it("traduz o código da marketplace-api quando a publicação é recusada", async () => {
    vi.mocked(productCatalogService.transitionOffering).mockRejectedValue(
      new ConflictError(409, [
        { field: "", code: "MKT_OFFER_COVERAGE_REQUIRED", detail: "" },
      ]),
    );
    const { result } = renderHook(() => usePublishOffering());

    let outcome;
    await act(async () => {
      outcome = await result.current.publish(SOFTWARE);
    });

    expect(outcome).toMatchObject({
      status: "draft",
      reasonKey: "SellerOffers.errors.coverageRequired",
    });
  });
});
