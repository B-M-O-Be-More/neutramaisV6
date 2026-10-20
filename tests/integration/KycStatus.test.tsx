import { describe, expect, it, vi } from "vitest";

import KycDocuments from "@/components/KycDocuments";
import KycStatus from "@/components/KycStatus";

import { fireEvent, renderWithProviders, screen } from "../test-utils";

describe("KycStatus", () => {
  it.each(["review", "approved", "complete"] as const)(
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
});

describe("KycDocuments · cabeçalho do cenário", () => {
  it.each([
    ["submit", "Register.flow.kyc.created.title"],
    ["resubmit", "Kyc.screens.resubmit.title"],
    ["rejected", "Kyc.screens.rejected.title"],
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
