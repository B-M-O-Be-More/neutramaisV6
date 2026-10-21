import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminKycReview from "@/components/AdminKycReview";
import {
  adminKycReviewService,
  type KycAccountDecisionResult,
  type KycReviewDocument,
  type KycReviewRequest,
} from "@/services/adminKycReview.service";
import { apiErrorFromResponse } from "@/services/errors";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

const REVIEWER = "018f5d13-c1a7-7f35-84de-92b6c4017a5d";
const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const REQUEST = "018f6a10-2c4e-7b31-9d5a-3e8f1c7a4b20";
const DECISION = "018f6a10-5555-7a01-9a01-000000000001";

vi.mock("@/contexts/SessionContext", () => ({
  useSession: () => ({ profile: { id: REVIEWER } }),
}));

function document(overrides: Partial<KycReviewDocument>): KycReviewDocument {
  return {
    id: "018f6a10-3a11-7e42-b0c3-1d5f7a9b2c01",
    document_type: "cnpj_card",
    submission_status: "submitted",
    review_status: "pending",
    current_version: 2,
    mime_type: "application/pdf",
    uploaded_at: "2026-10-14T18:19:40Z",
    reason_code: null,
    reason_details: null,
    reviewer_note: null,
    reviewed_by: null,
    reviewed_at: null,
    ...overrides,
  };
}

const CNPJ = document({});

function detail(overrides: Partial<KycReviewRequest> = {}): KycReviewRequest {
  return {
    request_id: REQUEST,
    display_id: "KYC-018F4C2A",
    status: "in_review",
    version: 4,
    requested_level: "verified",
    submitted_at: "2026-10-14T18:20:03Z",
    reviewer_id: REVIEWER,
    review_started_at: "2026-10-16T13:58:12Z",
    organization: {
      organization_id: ORGANIZATION,
      legal_name: "Acme Telecom Ltda",
      organization_type: "seller",
      tax_id: "12345678000195",
      tax_id_country: "BR",
    },
    documents: [CNPJ],
    automatic_checks: [
      {
        check_type: "sanctions",
        status: "not_verified",
        alert: false,
        expired: false,
        checked_at: null,
        valid_until: null,
        source: null,
        evidence_ref: null,
        policy: "advisory",
      },
    ],
    history: { items: [], total: 0, limit: 50, offset: 0 },
    correction_attempt_count: 0,
    latest_decision_id: null,
    activation_status: null,
    ...overrides,
  };
}

function decisionResult(
  overrides: Partial<KycAccountDecisionResult> = {},
): KycAccountDecisionResult {
  return {
    decision_id: DECISION,
    request_id: REQUEST,
    organization_id: ORGANIZATION,
    actor_id: REVIEWER,
    decision: "approve",
    requested_level: "verified",
    status: "approved",
    request_version: 7,
    correction_attempt_count: 0,
    activation_status: "applied",
    application_error: null,
    source_kyc_state: "under_review",
    source_kyc_level: "basic",
    documents: [],
    user_instructions: null,
    reason_code: null,
    ...overrides,
  };
}

const service = adminKycReviewService;

describe("AdminKycReview", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("abre a solicitação pelo organization_id e inicia a revisão com o version recebido", async () => {
    const open = vi
      .spyOn(service, "openRequest")
      .mockResolvedValue(detail({ status: "submitted", reviewer_id: null }));
    const start = vi
      .spyOn(service, "startReview")
      .mockResolvedValue(detail({ version: 5 }));

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    expect(await screen.findByText("Acme Telecom Ltda")).toBeInTheDocument();
    expect(open).toHaveBeenCalledWith(ORGANIZATION);

    fireEvent.click(screen.getByText("Admin.organization.actions.startReview"));

    await waitFor(() => expect(start).toHaveBeenCalledWith(REQUEST, 4));
    expect(
      await screen.findByText("Admin.review.actions.approve"),
    ).toBeInTheDocument();
  });

  it("com autoStart, inicia a revisão sozinho quando ela ainda não começou", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(
      detail({ status: "submitted", reviewer_id: null }),
    );
    const start = vi
      .spyOn(service, "startReview")
      .mockResolvedValue(detail({ version: 5 }));
    const handled = vi.fn();

    renderWithProviders(
      <AdminKycReview
        organizationId={ORGANIZATION}
        autoStart
        onAutoStartHandled={handled}
      />,
    );

    await waitFor(() => expect(start).toHaveBeenCalledTimes(1));
    expect(handled).toHaveBeenCalledTimes(1);
  });

  it("cada decisão de documento leva o version da última resposta", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(detail());
    const decide = vi
      .spyOn(service, "decideDocument")
      .mockResolvedValue(
        detail({
          version: 5,
          documents: [{ ...CNPJ, review_status: "approved" }],
        }),
      );
    const reopen = vi
      .spyOn(service, "reopenDocument")
      .mockResolvedValue(detail({ version: 6 }));

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    fireEvent.click(await screen.findByText("Admin.review.actions.approve"));
    await waitFor(() =>
      expect(decide).toHaveBeenCalledWith(REQUEST, CNPJ.id, {
        decision: "approve",
        document_version: 2,
        expected_version: 4,
      }),
    );

    fireEvent.click(await screen.findByText("Admin.review.actions.reopen"));
    await waitFor(() =>
      expect(reopen).toHaveBeenCalledWith(REQUEST, CNPJ.id, 5),
    );
  });

  it("recusa um documento com motivo e nota", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(detail());
    const decide = vi
      .spyOn(service, "decideDocument")
      .mockResolvedValue(
        detail({
          version: 5,
          documents: [{ ...CNPJ, review_status: "rejected" }],
        }),
      );

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    fireEvent.click(await screen.findByText("Admin.review.actions.reject"));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "expired_or_invalid" },
    });
    fireEvent.change(screen.getByLabelText(/Admin.review.form.reviewerNote/), {
      target: { value: "Cartão de 2019" },
    });
    fireEvent.click(screen.getByText("Admin.review.actions.confirmReject"));

    await waitFor(() =>
      expect(decide).toHaveBeenCalledWith(REQUEST, CNPJ.id, {
        decision: "reject",
        reason_code: "expired_or_invalid",
        reviewer_note: "Cartão de 2019",
        document_version: 2,
        expected_version: 4,
      }),
    );
  });

  it("relê o detalhe e avisa em conflito de versão", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(detail());
    vi.spyOn(service, "decideDocument").mockRejectedValue(
      apiErrorFromResponse(409, [
        {
          field: "_server",
          code: "version_conflict",
          detail: "version_conflict",
        },
      ]),
    );
    const get = vi
      .spyOn(service, "getRequest")
      .mockResolvedValue(detail({ version: 9 }));

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    fireEvent.click(await screen.findByText("Admin.review.actions.approve"));

    expect(
      await screen.findByText("Admin.review.errors.version_conflict"),
    ).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(REQUEST);
  });

  it("decide a conta com confirmação e repete a mesma chave e o mesmo corpo quando a aplicação falha", async () => {
    const approvedDocs = detail({
      documents: [{ ...CNPJ, review_status: "approved" }],
    });
    vi.spyOn(service, "openRequest").mockResolvedValue(approvedDocs);
    const failed = decisionResult({
      activation_status: "failed",
      application_error: "identity_unavailable",
    });
    const decide = vi
      .spyOn(service, "decideAccount")
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce(decisionResult());
    vi.spyOn(service, "getRequest").mockResolvedValue(
      detail({
        status: "approved",
        version: 7,
        documents: [{ ...CNPJ, review_status: "approved" }],
        latest_decision_id: DECISION,
        activation_status: "failed",
      }),
    );
    vi.spyOn(service, "getDecision").mockResolvedValue(failed);

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    fireEvent.click(
      await screen.findByRole("radio", {
        name: /Admin.review.decisions.approve.label/,
      }),
    );
    fireEvent.click(screen.getByText("Admin.review.actions.submitDecision"));
    fireEvent.click(
      await screen.findByText("Admin.review.actions.confirmDecision"),
    );

    await waitFor(() => expect(decide).toHaveBeenCalledTimes(1));
    const [requestId, body, key] = decide.mock.calls[0];
    expect(requestId).toBe(REQUEST);
    expect(body).toEqual({ decision: "approve", expected_version: 4 });
    expect(key).toEqual(expect.any(String));

    fireEvent.click(await screen.findByText("Admin.review.actions.retryApply"));

    await waitFor(() => expect(decide).toHaveBeenCalledTimes(2));
    expect(decide.mock.calls[1]).toEqual([REQUEST, body, key]);
  });

  it("não deixa aprovar com documento recusado", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(
      detail({ documents: [{ ...CNPJ, review_status: "rejected" }] }),
    );

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    expect(
      await screen.findByRole("radio", {
        name: /Admin.review.decisions.approve.label/,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("radio", {
        name: /Admin.review.decisions.request_correction.label/,
      }),
    ).toBeEnabled();
  });

  it("com snapshot desatualizado, oferece o refresh-review", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(
      detail({
        status: "approved",
        version: 7,
        latest_decision_id: DECISION,
        activation_status: "failed",
      }),
    );
    vi.spyOn(service, "getDecision").mockResolvedValue(
      decisionResult({
        activation_status: "failed",
        application_error: "kyc_decision_snapshot_stale",
      }),
    );
    const refresh = vi
      .spyOn(service, "refreshReview")
      .mockResolvedValue(
        detail({ status: "submitted", reviewer_id: null, version: 8 }),
      );

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    fireEvent.click(
      await screen.findByText("Admin.review.actions.refreshReview"),
    );

    await waitFor(() => expect(refresh).toHaveBeenCalledWith(REQUEST));
    expect(
      await screen.findByText("Admin.organization.actions.startReview"),
    ).toBeInTheDocument();
  });

  it("abre o arquivo no visualizador com a URL assinada", async () => {
    vi.spyOn(service, "openRequest").mockResolvedValue(detail());
    const access = vi.spyOn(service, "getDocumentUrl").mockResolvedValue({
      url: "https://storage.test/kyc/cnpj.pdf?sig=1",
      expires_at: "2026-10-19T12:05:00Z",
    });

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    fireEvent.click(await screen.findByText("Admin.review.actions.view"));

    await waitFor(() =>
      expect(access).toHaveBeenCalledWith(REQUEST, CNPJ.id, "view"),
    );
    expect(
      await screen.findByText("Admin.review.viewer.openInNewTab"),
    ).toHaveAttribute("href", "https://storage.test/kyc/cnpj.pdf?sig=1");
  });

  it("mostra o motivo quando falta MFA na sessão", async () => {
    vi.spyOn(service, "openRequest").mockRejectedValue(
      apiErrorFromResponse(403, [
        { field: "_server", code: "mfa_required", detail: "mfa_required" },
      ]),
    );

    renderWithProviders(<AdminKycReview organizationId={ORGANIZATION} />);

    expect(
      await screen.findByText("Admin.review.errors.mfa_required"),
    ).toBeInTheDocument();
  });
});
