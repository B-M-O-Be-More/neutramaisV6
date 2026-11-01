import { describe, expect, it, vi } from "vitest";

import SellerOfferCard from "@/components/SellerOfferCard";
import {
  offerLifecycleGates,
  type OfferLifecycleGates,
} from "@/functions/offerLifecycleGates";
import type { ProductOffering } from "@/services/productCatalog.service";
import type { ProfileContext } from "@/services/profileSession.service";

import { renderWithProviders, screen } from "../test-utils";

const OFFERING: ProductOffering = {
  id: "33333333-3333-4333-8333-333333333333",
  organizationId: "22222222-2222-4222-8222-222222222222",
  specificationId: "44444444-4444-4444-8444-444444444444",
  name: "Fibra 500 Mbps",
  monthlyPrice: "1890.00",
  installationPrice: "0.00",
  speed: "500 Mbps",
  durationMonths: 12,
  isPublic: false,
  status: "draft",
  isCorporate: true,
  stateCode: "SP",
  isCapital: true,
  coverageVersionId: "55555555-5555-4555-8555-555555555555",
  metadata: null,
  isActive: true,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-01T12:00:00Z",
};

const CONTEXT: ProfileContext = {
  organization_id: OFFERING.organizationId,
  user_id: "11111111-1111-4111-8111-111111111111",
  profile: "seller",
  roles: ["seller_commercial"],
  permissions: ["geo:coverage:read", "offer:publish", "offer:archive"],
  kyc_level: "verified",
  kyc_state: "verified",
  transaction_eligible: true,
  profile_version: 1,
  grant_version: 1,
  context_version: 1,
};

const renderCard = (
  offering: Partial<ProductOffering> = {},
  gates: OfferLifecycleGates = offerLifecycleGates(CONTEXT),
) => {
  const onAction = vi.fn();
  renderWithProviders(
    <SellerOfferCard
      offering={{ ...OFFERING, ...offering }}
      locale="pt-BR"
      gates={gates}
      onAction={onAction}
    />,
  );
  return onAction;
};

const publishButton = () =>
  screen.getByRole("button", { name: "SellerOffers.card.actions.publishNow" });

describe("offerLifecycleGates", () => {
  it("lê permissões e KYC do contexto do perfil", () => {
    expect(
      offerLifecycleGates({
        ...CONTEXT,
        permissions: ["offer:archive"],
        kyc_level: "basic",
      }),
    ).toEqual({ canPublish: false, canArchive: true, kycVerified: false });
    expect(
      offerLifecycleGates({ ...CONTEXT, kyc_level: "complete" }).kycVerified,
    ).toBe(true);
  });

  it("sem contexto não bloqueia: vale a resposta da API", () => {
    expect(offerLifecycleGates(null)).toEqual({
      canPublish: true,
      canArchive: true,
      kycVerified: true,
    });
  });
});

describe("SellerOfferCard", () => {
  it("publica quando há permissão, KYC verificado e cobertura", () => {
    const onAction = renderCard();

    publishButton().click();

    expect(onAction).toHaveBeenCalledWith("publish");
    expect(
      screen.queryByText("SellerOffers.errors.coverageRequired"),
    ).not.toBeInTheDocument();
  });

  it("sem cobertura, trava a publicação e diz o que falta", () => {
    renderCard({ coverageVersionId: null });

    expect(publishButton()).toBeDisabled();
    expect(
      screen.getByText("SellerOffers.errors.coverageRequired"),
    ).toBeInTheDocument();
  });

  it("produto físico publica sem cobertura quando tem o pacote de envio", () => {
    renderCard({
      productType: "physical",
      coverageVersionId: null,
      shipping: {
        weightKg: "1.250",
        heightCm: "10.00",
        widthCm: "25.50",
        lengthCm: "30.00",
        originPostalCode: "01310100",
        insuranceValue: "1200.00",
      },
    });

    expect(publishButton()).toBeEnabled();
    expect(
      screen.queryByText("SellerOffers.errors.coverageRequired"),
    ).not.toBeInTheDocument();
  });

  it("produto físico sem o pacote de envio trava a publicação", () => {
    renderCard({ productType: "physical", coverageVersionId: null });

    expect(publishButton()).toBeDisabled();
    expect(
      screen.getByText("SellerOffers.errors.shippingRequired"),
    ).toBeInTheDocument();
  });

  it("com KYC pendente, trava a publicação pelo KYC", () => {
    renderCard({}, offerLifecycleGates({ ...CONTEXT, kyc_level: "basic" }));

    expect(publishButton()).toBeDisabled();
    expect(
      screen.getByText("SellerOffers.errors.kycNotVerified"),
    ).toBeInTheDocument();
  });

  it("sem offer:publish e offer:archive, esconde as ações do ciclo de vida", () => {
    renderCard(
      { status: "paused" },
      offerLifecycleGates({ ...CONTEXT, permissions: [] }),
    );

    expect(
      screen.queryByRole("button", {
        name: "SellerOffers.card.actions.publish",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "SellerOffers.card.actions.unpublish",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "SellerOffers.card.actions.archive",
      }),
    ).not.toBeInTheDocument();
  });

  it("avisa a oferta publicada sem cobertura", () => {
    renderCard({
      status: "published",
      isPublic: true,
      coverageVersionId: null,
    });

    expect(
      screen.getByText("SellerOffers.card.publishedWithoutCoverage"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "SellerOffers.card.actions.pause" }),
    ).toBeEnabled();
  });

  it("produto físico publicado não recebe o aviso de cobertura", () => {
    renderCard({
      status: "published",
      isPublic: true,
      productType: "physical",
      coverageVersionId: null,
      shipping: {
        weightKg: "1.250",
        heightCm: "10.00",
        widthCm: "25.50",
        lengthCm: "30.00",
        originPostalCode: "01310100",
        insuranceValue: "1200.00",
      },
    });

    expect(
      screen.queryByText("SellerOffers.card.publishedWithoutCoverage"),
    ).not.toBeInTheDocument();
  });

  it("arquivada não tem ações do ciclo de vida", () => {
    renderCard({ status: "archived" });

    expect(
      screen.queryByRole("button", {
        name: "SellerOffers.card.actions.archive",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /SellerOffers\.card\.actions\.(publish|pause|unpublish)/,
      }),
    ).not.toBeInTheDocument();
  });
});
