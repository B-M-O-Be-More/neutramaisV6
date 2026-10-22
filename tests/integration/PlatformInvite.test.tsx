import { afterEach, describe, expect, it, vi } from "vitest";

import FormPlatformInvite from "@/components/Forms/FormPlatformInvite";
import { useInvitePlatformOperator } from "@/hooks/useInvitePlatformOperator";
import { apiErrorFromResponse } from "@/services/errors";
import { platformInvitesService } from "@/services/platformInvites.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

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

// O aceite do convite (comum a organização e plataforma) está em
// AcceptInvite.test.tsx.
describe("Convite de operador (admin)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("envia e-mail e papel no campo `role` e confirma o convite", async () => {
    const invite = vi
      .spyOn(platformInvitesService, "invite")
      .mockResolvedValue({});
    renderWithProviders(<InviteHarness />);

    fillInvite("Ana@Neutramais.com", "super_admin");

    await waitFor(() =>
      expect(invite).toHaveBeenCalledWith({
        email: "ana@neutramais.com",
        role: "super_admin",
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
