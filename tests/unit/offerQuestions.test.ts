import { describe, expect, it } from "vitest";

import {
  filterQuestions,
  hasBlockedContent,
  responseHours,
  summarizeQuestions,
} from "@/functions/offerQuestions";
import type { OfferQuestion } from "@/services/offerQuestions.service";

const question = (overrides: Partial<OfferQuestion> = {}): OfferQuestion => ({
  id: "q-1",
  protocol: "PER-2026-101",
  offeringId: "of-1",
  offeringName: "Link Dedicado 100 Mbps",
  question: "O prazo considera a vistoria técnica?",
  askedAt: "2026-07-09T10:00:00Z",
  answer: null,
  ...overrides,
});

const answered = (overrides: Partial<OfferQuestion> = {}) =>
  question({
    id: "q-2",
    protocol: "PER-2026-104",
    offeringId: "of-2",
    offeringName: "ONT GPON",
    question: "São homologadas pela Anatel?",
    answer: {
      text: "Sim, com fonte bivolt.",
      answeredAt: "2026-07-09T12:24:00Z",
    },
    ...overrides,
  });

describe("summarizeQuestions", () => {
  it("conta sem resposta e respondidas e calcula a taxa", () => {
    expect(summarizeQuestions([question(), answered()])).toEqual({
      unanswered: 1,
      answered: 1,
      responseRate: 0.5,
    });
    expect(summarizeQuestions([]).responseRate).toBe(0);
  });
});

describe("filterQuestions", () => {
  const all = [question(), answered()];

  it("filtra por situação, oferta e busca (incluindo a resposta)", () => {
    const base = { search: "", offeringId: "", status: "all" as const };
    expect(filterQuestions(all, { ...base, status: "answered" })).toHaveLength(
      1,
    );
    expect(filterQuestions(all, { ...base, offeringId: "of-1" })[0].id).toBe(
      "q-1",
    );
    expect(filterQuestions(all, { ...base, search: "bivolt" })[0].id).toBe(
      "q-2",
    );
    expect(
      filterQuestions(all, { ...base, search: "per-2026-101" }),
    ).toHaveLength(1);
  });
});

describe("responseHours", () => {
  it("horas entre a pergunta e a resposta", () => {
    expect(responseHours(answered())).toBeCloseTo(2.4);
    expect(responseHours(question())).toBeNull();
  });
});

describe("hasBlockedContent", () => {
  it.each([
    "fale comigo em vendas@empresa.com.br",
    "veja https://exemplo.com",
    "acesse www.exemplo.com",
    "nosso site empresa.com.br",
    "liga (11) 98765-4321",
    "chama no WhatsApp",
  ])("bloqueia %j", (text) => {
    expect(hasBlockedContent(text)).toBe(true);
  });

  it.each([
    "Sim. Todas possuem homologação Anatel e garantia de 12 meses.",
    "O bloco /29 está incluso. Ativação em até 30 dias, 100 Mbps.",
  ])("aceita %j", (text) => {
    expect(hasBlockedContent(text)).toBe(false);
  });
});
