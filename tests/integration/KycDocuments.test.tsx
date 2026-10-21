import { afterEach, describe, expect, it, vi } from "vitest";

import KycDocuments from "@/components/KycDocuments";
import { kycService } from "@/services/kyc.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

// Documentos do nível completo, na ordem da tela. Os 2 primeiros fecham o
// básico; os 4 primeiros, o verificado.
const REQUIRED = [
  "cnpj_card",
  "articles_of_incorporation",
  "legal_rep_id",
  "bank_proof",
  "address_proof",
  "revenue_proof",
  "representative_selfie",
];

const SUBMITTED = {
  organization_id: ORG_ID,
  kyc_state: "pending_documents",
  kyc_level: "pending",
} as const;

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

async function sendAll(types: string[]) {
  for (const type of types) {
    sendDocument(type, pdf(`${type}.pdf`));
    expect(await screen.findByText(`${type}.pdf`)).toBeInTheDocument();
  }
}

function chooseLevel(level: string) {
  fireEvent.click(screen.getByText(`Register.flow.kyc.levels.${level}.title`));
}

function mockUpload() {
  let next = 0;
  return vi
    .spyOn(kycService, "uploadArtifact")
    .mockImplementation(async (_orgId, data) => ({
      id: `artifact-${++next}`,
      organization_id: ORG_ID,
      document_type: data.document_type,
      kyc_level_supported: data.kyc_level_supported,
      retain_until: null,
      content_hash_masked: "ab12…ef90",
    }));
}

function cta() {
  return screen
    .getByText("Register.flow.kyc.cta")
    .closest("button") as HTMLButtonElement;
}

describe("KycDocuments", () => {
  afterEach(() => vi.restoreAllMocks());

  it("mostra os três grupos de documentos no nível completo", () => {
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    expect(
      screen.getByText("Register.flow.kyc.created.title"),
    ).toBeInTheDocument();
    for (const group of ["basic", "verified", "complete"]) {
      expect(
        screen.getByText(`Register.flow.kyc.groups.${group}`),
      ).toBeInTheDocument();
    }
  });

  it("no primeiro envio o básico é uma escolha e pede só os documentos dele", () => {
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    const basic = screen
      .getByText("Register.flow.kyc.levels.basic.title")
      .closest("button") as HTMLButtonElement;
    expect(basic).toBeEnabled();

    fireEvent.click(basic);
    expect(
      screen.getByText("Register.flow.kyc.groups.basic"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Register.flow.kyc.groups.verified"),
    ).not.toBeInTheDocument();
  });

  it("com básico concedido, só os níveis acima podem ser pedidos", () => {
    renderWithProviders(
      <KycDocuments
        organizationId={ORG_ID}
        currentLevel="basic"
        variant="upgrade"
        onFinish={vi.fn()}
      />,
    );

    expect(
      screen
        .getByText("Register.flow.kyc.levels.basic.title")
        .closest("button"),
    ).toBeDisabled();
    expect(
      screen
        .getByText("Register.flow.kyc.levels.verified.title")
        .closest("button"),
    ).toBeEnabled();
    expect(
      screen.getByText("Register.flow.kyc.levels.current"),
    ).toBeInTheDocument();
    // Subir de nível pede o conjunto inteiro de novo.
    expect(
      screen.getByText("Register.flow.kyc.fullSetNotice"),
    ).toBeInTheDocument();
  });

  it("envia cada arquivo em /kyc/artifacts com o arquivo real", async () => {
    const upload = mockUpload();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    const file = pdf("faturamento.pdf");
    sendDocument("revenue_proof", file);

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload).toHaveBeenCalledWith(ORG_ID, {
      document_type: "revenue_proof",
      kyc_level_supported: "complete",
      file,
    });
    expect(await screen.findByText("faturamento.pdf")).toBeInTheDocument();
  });

  it("registra o comprovante de endereço como documento do completo", async () => {
    const upload = mockUpload();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    sendDocument("address_proof", pdf("endereco.pdf"));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload).toHaveBeenCalledWith(
      ORG_ID,
      expect.objectContaining({
        document_type: "address_proof",
        kyc_level_supported: "complete",
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

  it("recusa arquivo acima de 10 MiB sem chamar a API", async () => {
    const upload = mockUpload();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    const big = pdf("grande.pdf");
    Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });
    sendDocument("bank_proof", big);

    expect(
      await screen.findByText("Register.flow.kyc.errors.fileSize"),
    ).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it("com os sete tipos do completo enviados, submete os ids e encerra", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue(SUBMITTED);
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    await sendAll(REQUIRED);
    fireEvent.click(cta());

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

  it("basta um entre contrato social e outorga SCM", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue(SUBMITTED);
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    chooseLevel("basic");
    expect(
      screen.getAllByText("Register.flow.kyc.oneOf.incorporation"),
    ).toHaveLength(2);

    await sendAll(["cnpj_card", "scm_outorga"]);
    expect(cta()).toBeEnabled();

    fireEvent.click(cta());
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(ORG_ID, ["artifact-1", "artifact-2"]),
    );
  });

  it("submete só os documentos do nível escolhido", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue(SUBMITTED);
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    // Um documento do completo enviado antes de trocar para o verificado.
    sendDocument("revenue_proof", pdf("faturamento.pdf"));
    expect(await screen.findByText("faturamento.pdf")).toBeInTheDocument();

    chooseLevel("verified");
    await sendAll(REQUIRED.slice(0, 4));
    fireEvent.click(cta());

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const ids = submit.mock.calls[0][1];
    expect(ids).toHaveLength(4);
    expect(ids).not.toContain("artifact-1");
  });

  it("trocar um arquivo substitui o id do documento", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit").mockResolvedValue(SUBMITTED);
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={vi.fn()} />,
    );

    chooseLevel("verified");
    await sendAll(REQUIRED.slice(0, 4));
    sendDocument("bank_proof", pdf("novo-extrato.pdf"));
    expect(await screen.findByText("novo-extrato.pdf")).toBeInTheDocument();

    fireEvent.click(cta());

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const ids = submit.mock.calls[0][1];
    expect(ids).toHaveLength(4);
    expect(ids).toContain("artifact-5");
    expect(ids).not.toContain("artifact-4");
  });

  it("com só parte dos obrigatórios, não deixa avançar", async () => {
    mockUpload();
    const submit = vi.spyOn(kycService, "submit");
    const onFinish = vi.fn();
    renderWithProviders(
      <KycDocuments organizationId={ORG_ID} onFinish={onFinish} />,
    );

    await sendAll(["bank_proof"]);

    expect(cta()).toBeDisabled();
    expect(
      screen.getByText("Register.flow.kyc.requiredHint"),
    ).toBeInTheDocument();

    fireEvent.click(cta());
    expect(submit).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("resposta sem id conta como falha do envio", async () => {
    vi.spyOn(kycService, "uploadArtifact").mockResolvedValue(
      {} as Awaited<ReturnType<typeof kycService.uploadArtifact>>,
    );
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

    expect(cta()).toBeDisabled();

    fireEvent.click(cta());
    expect(submit).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
