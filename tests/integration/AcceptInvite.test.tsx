import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AcceptInvite from "@/components/AcceptInvite";
import { authService } from "@/services/auth.service";
import { apiErrorFromResponse } from "@/services/errors";
import {
  invitesService,
  type AcceptInviteResult,
} from "@/services/invites.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));
const search = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/accept",
  useSearchParams: () => new URLSearchParams(search.value),
}));

// 43 caracteres de token_urlsafe(32).
const TOKEN = "Xy3_k-9QpLm2vNb8RtZaWc4dEfGh1JkL0oPqRsTuVwY";

function openLink(hash = `#token=${TOKEN}`) {
  window.history.replaceState(null, "", `/accept/${hash}`);
}

function fill(password = "SenhaForte#2026") {
  const field = (label: string) => screen.getByLabelText(new RegExp(label));
  fireEvent.change(field("PlatformInvite.fields.displayName.label"), {
    target: { value: "Ana Membro" },
  });
  fireEvent.change(field("PlatformInvite.fields.phone.label"), {
    target: { value: "+55 85 99999-9999" },
  });
  fireEvent.change(field("PlatformInvite.fields.password.label"), {
    target: { value: password },
  });
  fireEvent.change(field("PlatformInvite.fields.confirmation.label"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByText("PlatformInvite.accept.submit"));
}

function organization(
  overrides: Partial<AcceptInviteResult> = {},
): AcceptInviteResult {
  return {
    next_step: "home",
    user_id: "u-1",
    organization_id: "o-1",
    membership_id: "m-1",
    role: "seller_finance",
    mfa_enrollment_required: false,
    mfa_enrollment_token: null,
    mfa_enrollment_expires_in: null,
    mfa_enrollment_link_sent: false,
    ...overrides,
  } as AcceptInviteResult;
}

describe("AcceptInvite (/accept)", () => {
  beforeEach(() => {
    search.value = "";
    router.push.mockReset();
    openLink();
  });

  afterEach(() => vi.restoreAllMocks());

  it("lê o token do fragmento, tira da URL e envia só token, nome, telefone E.164 e senha", async () => {
    const accept = vi.spyOn(invitesService, "accept").mockResolvedValue({
      next_step: "login",
      user_id: "u-1",
      email: "admin@neutramais.com",
      mfa_enrollment_required: true,
    });

    renderWithProviders(<AcceptInvite />);

    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/accept/");

    fill();

    await waitFor(() =>
      expect(accept).toHaveBeenCalledWith({
        token: TOKEN,
        display_name: "Ana Membro",
        phone: "+5585999999999",
        password: "SenhaForte#2026",
      }),
    );
    // Plataforma: conta criada, sem sessão — o próximo passo é o login.
    expect(
      await screen.findByText("PlatformInvite.accept.success.title"),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("organização com sessão (`home`) segue para a área autenticada", async () => {
    vi.spyOn(invitesService, "accept").mockResolvedValue(organization());
    vi.spyOn(authService, "me").mockRejectedValue(new Error("sem /me"));

    renderWithProviders(<AcceptInvite />);
    fill();

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("organização com MFA obrigatório abre o cadastro do app com o token do aceite", async () => {
    vi.spyOn(invitesService, "accept").mockResolvedValue(
      organization({
        next_step: "mfa_enrollment",
        mfa_enrollment_required: true,
        mfa_enrollment_token: "enroll-token",
        mfa_enrollment_expires_in: 600,
      }),
    );
    const start = vi
      .spyOn(authService, "mfaEnrollmentStart")
      .mockResolvedValue({
        otpauth_uri: "otpauth://totp/Neutra%2B:ana?secret=JBSWY3DPEHPK3PXP",
        manual_key: "JBSWY3DPEHPK3PXP",
        recovery_codes: ["aaaa-1111"],
        expires_in: 590,
      });

    renderWithProviders(<AcceptInvite />);
    fill();

    fireEvent.click(await screen.findByText("MfaEnrollment.intro.start"));

    await waitFor(() => expect(start).toHaveBeenCalledWith("enroll-token"));
  });

  it("MFA obrigatório sem token: avisa do link enviado por e-mail e não repete o aceite", async () => {
    const accept = vi.spyOn(invitesService, "accept").mockResolvedValue(
      organization({
        next_step: "mfa_enrollment",
        mfa_enrollment_required: true,
        mfa_enrollment_link_sent: true,
      }),
    );

    renderWithProviders(<AcceptInvite />);
    fill();

    expect(
      await screen.findByText("PlatformInvite.accept.mfaLink.title"),
    ).toBeInTheDocument();
    expect(accept).toHaveBeenCalledTimes(1);
  });

  it("e-mail já cadastrado (409) oferece entrar para aceitar o convite", async () => {
    vi.spyOn(invitesService, "accept").mockRejectedValue(
      apiErrorFromResponse(409),
    );

    renderWithProviders(<AcceptInvite />);
    fill();

    fireEvent.click(
      await screen.findByText("PlatformInvite.accept.existing.cta"),
    );

    // Login na própria tela, com o token ainda em memória.
    expect(
      await screen.findByLabelText(/Login.fields.email.label/),
    ).toBeInTheDocument();
  });

  it("convite vencido ou usado (410) mostra a mensagem única", async () => {
    vi.spyOn(invitesService, "accept").mockRejectedValue(
      apiErrorFromResponse(410),
    );

    renderWithProviders(<AcceptInvite />);
    fill();

    expect(
      await screen.findByText("PlatformInvite.accept.error.subtitle"),
    ).toBeInTheDocument();
  });

  it("recusa senha sem minúscula antes de chamar a API", async () => {
    const accept = vi.spyOn(invitesService, "accept");

    renderWithProviders(<AcceptInvite />);
    fill("SENHAFORTE#2026");

    expect(
      await screen.findByText("PlatformInvite.errors.passwordNeedsLowercase"),
    ).toBeInTheDocument();
    expect(accept).not.toHaveBeenCalled();
  });

  it("aceita o token em `?token=` como alternativa", async () => {
    window.history.replaceState(null, "", "/platform-invites/accept");
    search.value = `token=${TOKEN}`;
    const accept = vi.spyOn(invitesService, "accept").mockResolvedValue({
      next_step: "login",
      user_id: "u-1",
      email: "admin@neutramais.com",
      mfa_enrollment_required: true,
    });

    renderWithProviders(<AcceptInvite />);
    fill();

    await waitFor(() =>
      expect(accept).toHaveBeenCalledWith(
        expect.objectContaining({ token: TOKEN }),
      ),
    );
  });

  it("sem token no link, não mostra o formulário", () => {
    window.history.replaceState(null, "", "/accept/");

    renderWithProviders(<AcceptInvite />);

    expect(
      screen.getByText("PlatformInvite.accept.error.missing"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("PlatformInvite.accept.submit"),
    ).not.toBeInTheDocument();
  });
});
