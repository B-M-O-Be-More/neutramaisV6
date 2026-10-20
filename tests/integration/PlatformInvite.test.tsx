import { afterEach, describe, expect, it, vi } from "vitest";

import AcceptPlatformInvite from "@/components/AcceptPlatformInvite";
import FormPlatformInvite from "@/components/Forms/FormPlatformInvite";
import { useInvitePlatformOperator } from "@/hooks/useInvitePlatformOperator";
import { apiErrorFromResponse } from "@/services/errors";
import { platformInvitesService } from "@/services/platformInvites.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

// Token do link do convite — o setup global devolve uma query vazia.
const search = vi.hoisted(() => ({ value: "token=convite-123" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(search.value),
}));

// Mesma composição da página /admin/platform-invites.
function InviteHarness() {
  const { invite, isSubmitting, formError, sentTo } =
    useInvitePlatformOperator();
  return (
    <FormPlatformInvite
      onSubmit={invite}
      isSubmitting={isSubmitting}
      formError={formError}
      sentTo={sentTo}
    />
  );
}

function fillInvite(email: string, role: string) {
  fireEvent.change(screen.getByLabelText(/PlatformInvite.fields.email.label/), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/PlatformInvite.fields.role.label/), {
    target: { value: role },
  });
  fireEvent.click(screen.getByText("PlatformInvite.submit"));
}

function fillAccept(phone = "+55 11 99999-9999") {
  const field = (label: string) => screen.getByLabelText(new RegExp(label));
  fireEvent.change(field("PlatformInvite.fields.displayName.label"), {
    target: { value: "Ana Operadora" },
  });
  fireEvent.change(field("PlatformInvite.fields.phone.label"), {
    target: { value: phone },
  });
  fireEvent.change(field("PlatformInvite.fields.password.label"), {
    target: { value: "SenhaForte#2026" },
  });
  fireEvent.change(field("PlatformInvite.fields.confirmation.label"), {
    target: { value: "SenhaForte#2026" },
  });
  fireEvent.click(screen.getByText("PlatformInvite.accept.submit"));
}

describe("Convite de operador (admin)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("envia e-mail e papel e confirma o convite", async () => {
    const invite = vi
      .spyOn(platformInvitesService, "invite")
      .mockResolvedValue({});
    renderWithProviders(<InviteHarness />);

    fillInvite("Ana@Neutramais.com", "super_admin");

    await waitFor(() =>
      expect(invite).toHaveBeenCalledWith({
        email: "ana@neutramais.com",
        target_role: "super_admin",
      }),
    );
    expect(await screen.findByText("PlatformInvite.sent")).toBeInTheDocument();
  });

  it("não envia sem papel escolhido", async () => {
    const invite = vi.spyOn(platformInvitesService, "invite");
    renderWithProviders(<InviteHarness />);

    fillInvite("ana@neutramais.com", "");

    expect(
      await screen.findByText("PlatformInvite.errors.roleRequired"),
    ).toBeInTheDocument();
    expect(invite).not.toHaveBeenCalled();
  });

  it("avisa quando a sessão não é super admin com MFA", async () => {
    vi.spyOn(platformInvitesService, "invite").mockRejectedValue(
      apiErrorFromResponse(403),
    );
    renderWithProviders(<InviteHarness />);

    fillInvite("ana@neutramais.com", "support");

    expect(
      await screen.findByText("PlatformInvite.errors.forbidden"),
    ).toBeInTheDocument();
  });
});

describe("Aceite do convite (público)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    search.value = "token=convite-123";
  });

  it("cria a conta com o token do link e o telefone em E.164", async () => {
    const accept = vi
      .spyOn(platformInvitesService, "accept")
      .mockResolvedValue({});
    renderWithProviders(<AcceptPlatformInvite />);

    fillAccept();

    await waitFor(() =>
      expect(accept).toHaveBeenCalledWith({
        token: "convite-123",
        display_name: "Ana Operadora",
        phone: "+5511999999999",
        password: "SenhaForte#2026",
      }),
    );
    expect(
      await screen.findByText("PlatformInvite.accept.success.title"),
    ).toBeInTheDocument();
  });

  it("recusa telefone fora do formato internacional", async () => {
    const accept = vi.spyOn(platformInvitesService, "accept");
    renderWithProviders(<AcceptPlatformInvite />);

    fillAccept("123");

    expect(
      await screen.findByText("PlatformInvite.errors.phoneInvalid"),
    ).toBeInTheDocument();
    expect(accept).not.toHaveBeenCalled();
  });

  it("mostra convite inválido quando o token expirou", async () => {
    vi.spyOn(platformInvitesService, "accept").mockRejectedValue(
      apiErrorFromResponse(400),
    );
    renderWithProviders(<AcceptPlatformInvite />);

    fillAccept();

    expect(
      await screen.findByText("PlatformInvite.accept.error.title"),
    ).toBeInTheDocument();
  });

  it("sem token no link, não mostra o formulário", () => {
    search.value = "";
    renderWithProviders(<AcceptPlatformInvite />);

    expect(
      screen.getByText("PlatformInvite.accept.error.missing"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("PlatformInvite.accept.submit"),
    ).not.toBeInTheDocument();
  });
});
