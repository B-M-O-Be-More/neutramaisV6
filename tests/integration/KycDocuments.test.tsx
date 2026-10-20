import { afterEach, describe, expect, it, vi } from "vitest";

import KycDocuments from "@/components/KycDocuments";
import { kycService } from "@/services/kyc.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

// Documentos obrigatórios do nível completo (básico + verificado + completo).
// Os 5 primeiros são os do nível verificado.
const REQUIRED = [
  "cnpj_card",
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

  it("o nível básico é só informativo: não dá para escolhê-lo", () => {
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    const basic = screen
      .getByText("Register.flow.kyc.levels.basic.title")
      .closest("button") as HTMLButtonElement;
    expect(basic).toBeDisabled();

    fireEvent.click(basic);
    expect(
      screen.getByText("Register.flow.kyc.groups.verified"),
    ).toBeInTheDocument();
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

  it("pede o cartão CNPJ e o registra como verificação do nível básico", async () => {
    const upload = mockUpload();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    expect(
      screen.getByText("Register.flow.kyc.groups.basic"),
    ).toBeInTheDocument();

    sendDocument("cnpj_card", pdf("cartao-cnpj.pdf"));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload).toHaveBeenCalledWith(
      ORG_ID,
      expect.objectContaining({
        document_type: "cnpj_card",
        kyc_level_supported: "basic",
      }),
    );
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
      "artifact-7",
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
    for (const type of REQUIRED.slice(0, 5)) {
      sendDocument(type, pdf(`${type}.pdf`));
      expect(await screen.findByText(`${type}.pdf`)).toBeInTheDocument();
    }
    sendDocument("bank_proof", pdf("novo-extrato.pdf"));
    expect(await screen.findByText("novo-extrato.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const ids = submit.mock.calls[0][1];
    expect(ids).toHaveLength(5);
    expect(ids).toContain("artifact-6");
    expect(ids).not.toContain("artifact-2");
  });

  it("com só parte dos obrigatórios, não deixa avançar", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit");
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    sendDocument("bank_proof", pdf("extrato.pdf"));
    expect(await screen.findByText("extrato.pdf")).toBeInTheDocument();

    const cta = screen
      .getByText("Register.flow.kyc.cta")
      .closest("button") as HTMLButtonElement;
    expect(cta).toBeDisabled();
    expect(
      screen.getByText("Register.flow.kyc.requiredHint"),
    ).toBeInTheDocument();

    fireEvent.click(cta);
    expect(submit).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("opcionais não são exigidos para avançar", async () => {
    mockUpload();
    vi.spyOn(kycService, "submit").mockResolvedValue({
      organization_id: ORG_ID,
      kyc_state: "under_review",
      submitted_at: "2026-08-06T14:32:10Z",
    });
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    // Verificado: 4 obrigatórios; a licença SCM é opcional e fica de fora.
    fireEvent.click(
      screen.getByText("Register.flow.kyc.levels.verified.title"),
    );
    for (const type of REQUIRED.slice(0, 5)) {
      sendDocument(type, pdf(`${type}.pdf`));
      expect(await screen.findByText(`${type}.pdf`)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });

  it("aceita o id no campo `id` (formato do openapi) e submete", async () => {
    let next = 0;
    vi.spyOn(kycService, "uploadArtifact").mockImplementation(
      async (_orgId, data) => ({
        id: `id-${++next}`,
        document_type: data.document_type,
        kyc_level_supported: data.kyc_level_supported,
        content_hash: "",
        created_at: "2026-08-06T14:32:10Z",
      }),
    );
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue({
      organization_id: ORG_ID,
      kyc_state: "under_review",
      submitted_at: "2026-08-06T14:32:10Z",
    });
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    fireEvent.click(
      screen.getByText("Register.flow.kyc.levels.verified.title"),
    );
    for (const type of REQUIRED.slice(0, 5)) {
      sendDocument(type, pdf(`${type}.pdf`));
      expect(await screen.findByText(`${type}.pdf`)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByText("Register.flow.kyc.cta"));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith(ORG_ID, [
      "id-1",
      "id-2",
      "id-3",
      "id-4",
      "id-5",
    ]);
  });

  it("resposta sem id conta como falha do envio", async () => {
    vi.spyOn(kycService, "uploadArtifact").mockResolvedValue({
      document_type: "bank_proof",
      kyc_level_supported: "verified",
      content_hash: "",
      created_at: "2026-08-06T14:32:10Z",
    });
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    sendDocument("bank_proof", pdf("extrato.pdf"));

    expect(
      await screen.findByText("Register.flow.kyc.errors.upload"),
    ).toBeInTheDocument();
    expect(screen.queryByText("extrato.pdf")).not.toBeInTheDocument();
  });

  it("sem nenhum documento enviado, o botão fica desabilitado", () => {
    const submit = vi.spyOn(kycService, "submit");
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    const cta = screen
      .getByText("Register.flow.kyc.cta")
      .closest("button") as HTMLButtonElement;
    expect(cta).toBeDisabled();

    fireEvent.click(cta);
    expect(submit).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
