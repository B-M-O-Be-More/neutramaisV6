import { describe, expect, it, vi } from "vitest";

import KycDocuments from "@/components/KycDocuments";
import KycStatus from "@/components/KycStatus";

import { fireEvent, renderWithProviders, screen } from "../test-utils";

describe("KycStatus", () => {
  it.each(["review", "approved", "complete", "rejected", "suspended"] as const)(
    "mostra o cenário %s e segue para o dashboard",
    (variant) => {
      const onContinue = vi.fn();
      renderWithProviders(
        <KycStatus variant={variant} onContinue={onContinue} />,
      );

      expect(
        screen.getByText(`Kyc.screens.${variant}.title`),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText("Kyc.screens.continue"));
      expect(onContinue).toHaveBeenCalledTimes(1);
    },
  );

  it("em análise, oferece o reenvio para quem recebeu um pedido de correção", () => {
    const onCorrection = vi.fn();
    renderWithProviders(
      <KycStatus
        variant="review"
        onContinue={vi.fn()}
        onCorrection={onCorrection}
      />,
    );

    fireEvent.click(screen.getByText("Kyc.screens.review.correction"));
    expect(onCorrection).toHaveBeenCalledTimes(1);
  });

  it.each(["approved", "rejected", "suspended"] as const)(
    "%s não oferece reenvio",
    (variant) => {
      renderWithProviders(
        <KycStatus
          variant={variant}
          onContinue={vi.fn()}
          onCorrection={vi.fn()}
        />,
      );

      expect(
        screen.queryByText("Kyc.screens.review.correction"),
      ).not.toBeInTheDocument();
    },
  );
});

describe("KycDocuments · cabeçalho do cenário", () => {
  it.each([
    ["submit", "Register.flow.kyc.created.title"],
    ["upgrade", "Kyc.screens.upgrade.title"],
    ["resubmit", "Kyc.screens.resubmit.title"],
  ] as const)("%s → %s", (variant, title) => {
    renderWithProviders(
      <KycDocuments
        organizationId="org-1"
        variant={variant}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText(title)).toBeInTheDocument();
  });
});
