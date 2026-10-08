import { afterEach, describe, expect, it, vi } from "vitest";

import KycDocuments from "@/components/KycDocuments";
import { kycService } from "@/services/kyc.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

// Documentos obrigatórios do nível completo (verificado + completo).
const REQUIRED = [
  "bank_proof",
  "legal_rep_id",
  "articles_of_incorporation",
  "address_proof",
  "revenue_proof",
  "representative_selfie",
];

function pdf(name: string) {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

/** Clica em "Enviar" na linha do documento e escolhe o arquivo. */
function sendDocument(type: string, file: File) {
  const row = screen.getByText(`Register.flow.kyc.docs.${type}`).closest("div")
    ?.parentElement as HTMLElement;
  fireEvent.click(row.querySelector("button") as HTMLButtonElement);
  fireEvent.change(screen.getByTestId("kyc-file-input"), {
    target: { files: [file] },
  });
}

function mockUpload() {
  let next = 0;
  return vi
    .spyOn(kycService, "uploadArtifact")
    .mockImplementation(async (_orgId, data) => ({
      artifact_id: `artifact-${++next}`,
      document_type: data.document_type,
      kyc_level_supported: data.kyc_level_supported,
      content_hash: data.content_hash,
      created_at: "2026-08-06T14:32:10Z",
    }));
}

describe("KycDocuments", () => {
  afterEach(() => vi.restoreAllMocks());

  it("mostra os dois grupos de documentos no nível completo", () => {
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    expect(
      screen.getByText("Register.flow.kyc.created.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.kyc.groups.verified"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.kyc.groups.complete"),
    ).toBeInTheDocument();
  });

  it("no nível básico não pede documentos", () => {
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Register.flow.kyc.levels.basic.title"));

    expect(
      screen.queryByText("Register.flow.kyc.groups.verified"),
    ).not.toBeInTheDocument();
  });

  it("registra cada arquivo em /kyc/artifacts com hash e nome do arquivo", async () => {
    const upload = mockUpload();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    sendDocument("revenue_proof", pdf("faturamento.pdf"));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload).toHaveBeenCalledWith(ORG_ID, {
      document_type: "revenue_proof",
      kyc_level_supported: "complete",
      s3_reference: "faturamento.pdf",
      content_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      mime_type: "application/pdf",
    });
    expect(await screen.findByText("faturamento.pdf")).toBeInTheDocument();
  });

  it("recusa formatos fora da whitelist sem chamar a API", async () => {
    const upload = mockUpload();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    sendDocument(
      "bank_proof",
      new File(["x"], "extrato.docx", { type: "application/msword" }),
    );

    expect(
      await screen.findByText("Register.flow.kyc.errors.mimeType"),
    ).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it("com os obrigatórios enviados, submete os artifact_id e encerra", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue({
      organization_id: ORG_ID,
      kyc_state: "under_review",
      submitted_at: "2026-08-06T14:32:10Z",
    });
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    for (const type of REQUIRED) {
      sendDocument(type, pdf(`${type}.pdf`));
      expect(await screen.findByText(`${type}.pdf`)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith(ORG_ID, [
      "artifact-1",
      "artifact-2",
      "artifact-3",
      "artifact-4",
      "artifact-5",
      "artifact-6",
    ]);
  });

  it("trocar um arquivo substitui o artifact_id do documento", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue({
      organization_id: ORG_ID,
      kyc_state: "under_review",
      submitted_at: "2026-08-06T14:32:10Z",
    });
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    // Nível verificado: só o primeiro grupo é obrigatório.
    fireEvent.click(
      screen.getByText("Register.flow.kyc.levels.verified.title"),
    );
    for (const type of REQUIRED.slice(0, 4)) {
      sendDocument(type, pdf(`${type}.pdf`));
      expect(await screen.findByText(`${type}.pdf`)).toBeInTheDocument();
    }
    sendDocument("bank_proof", pdf("novo-extrato.pdf"));
    expect(await screen.findByText("novo-extrato.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const ids = submit.mock.calls[0][1];
    expect(ids).toHaveLength(4);
    expect(ids).toContain("artifact-5");
    expect(ids).not.toContain("artifact-1");
  });

  it("com só parte dos documentos, submete os artifact_id já registrados", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue({
      organization_id: ORG_ID,
      kyc_state: "under_review",
      submitted_at: "2026-08-06T14:32:10Z",
    });
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    sendDocument("bank_proof", pdf("extrato.pdf"));
    expect(await screen.findByText("extrato.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith(ORG_ID, ["artifact-1"]);
  });

  it("sem nenhum documento enviado, encerra sem submeter", async () => {
    const submit = vi.spyOn(kycService, "submit");
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(submit).not.toHaveBeenCalled();
  });
});
