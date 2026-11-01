import { describe, expect, it, vi } from "vitest";

import SellerQuestions from "@/components/SellerQuestions";
import type { OfferQuestion } from "@/services/offerQuestions.service";

import { renderWithProviders, screen, within } from "../test-utils";

const UNANSWERED: OfferQuestion = {
  id: "q-102",
  protocol: "PER-2026-102",
  offeringId: "of-ont",
  offeringName: "ONT GPON 4 Portas WiFi 6",
  question:
    "É possível solicitar o lote já provisionado com nosso perfil de VLAN?",
  askedAt: "2026-07-10T09:00:00Z",
  answer: null,
};

const ANSWERED: OfferQuestion = {
  id: "q-104",
  protocol: "PER-2026-104",
  offeringId: "of-fiber",
  offeringName: "Internet Fibra Premium 500 Mbps",
  question: "O IPv4 fixo /29 está incluso no valor mensal?",
  askedAt: "2026-07-08T10:00:00Z",
  answer: {
    text: "O bloco /29 está incluso na mensalidade.",
    answeredAt: "2026-07-08T11:48:00Z",
  },
};

function renderQuestions(
  questions: OfferQuestion[],
  answer?: React.ComponentProps<typeof SellerQuestions>["answer"],
) {
  return renderWithProviders(
    <SellerQuestions questions={questions} locale="pt-BR" answer={answer} />,
  );
}

const publishButton = () =>
  screen.getByRole("button", { name: "SellerQuestions.answer.publish" });

describe("SellerQuestions", () => {
  it("sem perguntas, mostra os contadores zerados e o vazio", () => {
    renderQuestions([]);

    expect(
      screen.getByRole("heading", { name: "SellerQuestions.title" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("SellerQuestions.empty")).toBeInTheDocument();
    expect(
      screen.getByText("SellerQuestions.whoCanAnswer.title"),
    ).toBeInTheDocument();
  });

  it("lista as perguntas: sem resposta com o campo, respondida com a resposta pública", () => {
    renderQuestions([UNANSWERED, ANSWERED]);

    expect(screen.getByText("50%")).toBeInTheDocument();
    const [pending, done] = screen.getAllByRole("article");

    expect(
      within(pending).getByText(
        /SellerQuestions.verifiedBuyer · .* · PER-2026-102/,
      ),
    ).toBeInTheDocument();
    expect(
      within(pending).getByLabelText("SellerQuestions.answer.label"),
    ).toBeInTheDocument();

    expect(
      within(done).getByText("O bloco /29 está incluso na mensalidade."),
    ).toBeInTheDocument();
    // 1h48 = 1,8h.
    expect(
      within(done).getByText(/SellerQuestions.answer.answeredIn/),
    ).toBeInTheDocument();
    expect(
      within(done).queryByRole("button", {
        name: "SellerQuestions.answer.publish",
      }),
    ).not.toBeInTheDocument();
  });

  it("filtra pelas abas, pela oferta e pela busca", async () => {
    const { user } = renderQuestions([UNANSWERED, ANSWERED]);

    await user.click(
      screen.getByRole("tab", {
        name: /SellerQuestions.filters.statuses.answered/,
      }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText(ANSWERED.question)).toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: /SellerQuestions.filters.statuses.all/ }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "SellerQuestions.filters.offering",
      }),
      "of-ont",
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText(UNANSWERED.question)).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "SellerQuestions.filters.search" }),
      "nada assim",
    );
    expect(
      screen.getByText("SellerQuestions.emptyFiltered"),
    ).toBeInTheDocument();
  });

  it("exige a resposta e bloqueia contatos e links antes de publicar", async () => {
    const answer = vi.fn();
    const { user } = renderQuestions([UNANSWERED], answer);

    await user.click(publishButton());
    expect(
      screen.getByText("SellerQuestions.answer.errors.required"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("SellerQuestions.answer.label"),
      "Sim, fale com vendas@empresa.com.br",
    );
    await user.click(publishButton());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "SellerQuestions.answer.errors.blocked",
    );
    expect(answer).not.toHaveBeenCalled();
  });

  it("publica a resposta e a pergunta passa a respondida", async () => {
    const answer = vi.fn().mockResolvedValue({
      text: "Sim, provisionamos com o perfil enviado.",
      answeredAt: "2026-07-10T11:00:00Z",
    });
    const { user } = renderQuestions([UNANSWERED], answer);

    const field = screen.getByLabelText("SellerQuestions.answer.label");
    await user.type(field, "Sim, provisionamos com o perfil enviado.");
    expect(screen.getByText("40/600")).toBeInTheDocument();
    await user.click(publishButton());

    expect(answer).toHaveBeenCalledWith(
      "q-102",
      "Sim, provisionamos com o perfil enviado.",
    );
    expect(
      await screen.findByText("SellerQuestions.answer.publicTitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("sem a rota de perguntas, explica que nada foi publicado", async () => {
    const { user } = renderQuestions([UNANSWERED]);

    await user.type(
      screen.getByLabelText("SellerQuestions.answer.label"),
      "Sim, é possível.",
    );
    await user.click(publishButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "SellerQuestions.answer.errors.unavailable",
    );
  });
});
