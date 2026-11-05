import { beforeEach, describe, expect, it, vi } from "vitest";

import FormRegister from "@/components/Forms/FormRegister";
import { RegisterFlowProvider } from "@/contexts/RegisterFlowContext";
import { saveRegisterHandoff } from "@/functions/registerHandoff";
import { authService } from "@/services/auth.service";
import { RateLimitError } from "@/services/errors";

import { renderWithProviders, screen } from "../../test-utils";

// Verificação retomada pela URL (`?resume=verify`), como o login de uma conta
// pré-cadastrada deixa o usuário.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("resume=verify"),
}));

vi.mock("@/services/auth.service", () => ({
  authService: { resendEmailConfirmation: vi.fn() },
}));

const USER_ID = "019fee5d-e152-7380-9fc0-800f08cf6d7e";

function seedHandoff(userId?: string) {
  saveRegisterHandoff({
    organizationId: "019fee5d-e14f-7c21-a1b2-3c4d5e6f7a8b",
    email: "ana@empresa.com",
    step: 4,
    emailConfirmed: false,
    userId,
  });
}

function renderVerify() {
  return renderWithProviders(
    <RegisterFlowProvider>
      <FormRegister />
    </RegisterFlowProvider>,
  );
}

describe("FormRegister — reenvio do e-mail na Verificação", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authService.resendEmailConfirmation).mockReset();
  });

  it("reenvia o link para o usuário do handoff", async () => {
    seedHandoff(USER_ID);
    vi.mocked(authService.resendEmailConfirmation).mockResolvedValue(null);
    const { user } = renderVerify();

    await user.click(
      screen.getByRole("button", { name: "Register.flow.verify.email.resend" }),
    );

    expect(authService.resendEmailConfirmation).toHaveBeenCalledWith(USER_ID);
    expect(
      await screen.findByText("Register.flow.verify.email.resent"),
    ).toBeInTheDocument();
  });

  it("mostra o limite de reenvios no 429", async () => {
    seedHandoff(USER_ID);
    vi.mocked(authService.resendEmailConfirmation).mockRejectedValue(
      new RateLimitError(429),
    );
    const { user } = renderVerify();

    await user.click(
      screen.getByRole("button", { name: "Register.flow.verify.email.resend" }),
    );

    expect(
      await screen.findByText("Register.flow.verify.email.errors.rateLimit"),
    ).toBeInTheDocument();
  });

  it("sem user_id no handoff não oferece o reenvio", () => {
    seedHandoff();
    renderVerify();

    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Register.flow.verify.email.resend",
      }),
    ).not.toBeInTheDocument();
  });
});
