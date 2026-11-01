"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerQuestions from "@/components/SellerQuestions";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import type { OfferQuestion } from "@/services/offerQuestions.service";

// Nenhuma API lista as perguntas públicas ainda (RN-RFQ-02 é complemento
// proposto): a tela mostra o estado vazio até a rota existir.
const NO_QUESTIONS: OfferQuestion[] = [];

function QuestionsContent() {
  const { i18n } = useTranslation();
  return (
    <SellerQuestions
      questions={NO_QUESTIONS}
      locale={currencyLocale(i18n.language)}
    />
  );
}

// Perguntas recebidas nas ofertas do seller (Figma 2951-60629), no perfil
// Seller — quem pode responder é Dono, Comercial, Operação e Suporte.
export default function SellerQuestionsPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider requiredPermission={null}>
        <QuestionsContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
