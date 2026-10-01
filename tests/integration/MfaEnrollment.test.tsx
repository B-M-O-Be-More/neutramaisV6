import { describe, expect, it, vi } from "vitest";

import MfaEnrollmentQrCode from "@/components/MfaEnrollmentQrCode";
import MfaEnrollmentStatus from "@/components/MfaEnrollmentStatus";
import MfaRecoveryCodes from "@/components/MfaRecoveryCodes";

import { renderWithProviders, screen, within } from "../test-utils";

const CODES = ["aaaa-1111", "bbbb-2222", "cccc-3333", "dddd-4444", "eeee-5"];

// O i18n devolve as chaves nos testes (traduções carregam via HTTP em runtime).
describe("MfaEnrollmentQrCode", () => {
  it("gera o QR localmente e exibe a chave manual agrupada", () => {
    renderWithProviders(
      <MfaEnrollmentQrCode
        otpauthUri="otpauth://totp/Neutra%2B:admin?secret=JBSWY3DPEHPK3PXP"
        manualKey="JBSWY3DPEHPK3PXP"
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    // SVG renderizado na própria página — nenhum <img> apontando para fora.
    const qr = screen.getByRole("img", {
      name: "MfaEnrollment.qrCode.qrLabel",
    });
    expect(qr.tagName.toLowerCase()).toBe("svg");
    expect(screen.getByTestId("mfa-manual-key")).toHaveTextContent(
      "JBSW Y3DP EHPK 3PXP",
    );
    expect(
      screen.getByRole("button", {
        name: "MfaEnrollment.qrCode.manualKey.copy",
      }),
    ).toBeInTheDocument();
  });
});

describe("MfaRecoveryCodes", () => {
  it("renderiza todos os códigos devolvidos, numerados em duas colunas", () => {
    renderWithProviders(
      <MfaRecoveryCodes
        codes={CODES}
        saved={false}
        onSavedChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const group = screen.getByRole("group", {
      name: "MfaEnrollment.recoveryCodes.listLabel",
    });
    const lists = within(group).getAllByRole("list");
    expect(lists).toHaveLength(2);
    expect(within(group).getAllByRole("listitem")).toHaveLength(5);
    expect(within(lists[1]).getByText("4.")).toBeInTheDocument();
    expect(screen.getByText("eeee-5")).toBeInTheDocument();
  });

  it("não avança sem a confirmação de que os códigos foram guardados", async () => {
    const onNext = vi.fn();
    const { user } = renderWithProviders(
      <MfaRecoveryCodes
        codes={CODES}
        saved={false}
        onSavedChange={vi.fn()}
        onNext={onNext}
        onBack={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /MfaEnrollment.recoveryCodes.next/ }),
    );

    expect(
      await screen.findByText("MfaEnrollment.errors.recoveryCodesNotSaved"),
    ).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("marca a confirmação e avança", async () => {
    const onSavedChange = vi.fn();
    const onNext = vi.fn();
    const { user, rerender } = renderWithProviders(
      <MfaRecoveryCodes
        codes={CODES}
        saved={false}
        onSavedChange={onSavedChange}
        onNext={onNext}
        onBack={vi.fn()}
      />,
    );

    await user.click(
      screen.getByText("MfaEnrollment.recoveryCodes.acknowledge"),
    );
    expect(onSavedChange).toHaveBeenCalledWith(true);

    rerender(
      <MfaRecoveryCodes
        codes={CODES}
        saved
        onSavedChange={onSavedChange}
        onNext={onNext}
        onBack={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /MfaEnrollment.recoveryCodes.next/ }),
    );
    expect(onNext).toHaveBeenCalled();
  });
});

describe("MfaEnrollmentStatus", () => {
  it.each(["error", "rateLimit", "timeout"] as const)(
    "tela %s volta ao login pelos dois botões",
    async (failure) => {
      const onBackToLogin = vi.fn();
      const { user } = renderWithProviders(
        <MfaEnrollmentStatus
          failure={failure}
          retryInSeconds={240}
          onBackToLogin={onBackToLogin}
        />,
      );

      expect(
        screen.getByText(`MfaEnrollment.failure.${failure}.title`),
      ).toBeInTheDocument();

      const buttons = screen.getAllByRole("button", {
        name: /MfaEnrollment.backToLogin/,
      });
      expect(buttons).toHaveLength(2);
      await user.click(buttons[1]);
      expect(onBackToLogin).toHaveBeenCalledTimes(1);
    },
  );

  it("muitas tentativas: mostra o bloqueio e a liberação estimada", () => {
    renderWithProviders(
      <MfaEnrollmentStatus
        failure="rateLimit"
        retryInSeconds={240}
        onBackToLogin={vi.fn()}
      />,
    );

    expect(
      screen.getByText("MfaEnrollment.failure.rateLimit.blocked.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("MfaEnrollment.failure.rateLimit.release.inMinutes"),
    ).toBeInTheDocument();
  });
});
