"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuShieldCheck } from "react-icons/lu";

import OfferQuestionCard, {
  type AnswerResult,
} from "@/components/OfferQuestionCard";
import SellerQuestionsFilters from "@/components/SellerQuestionsFilters";
import {
  filterQuestions,
  summarizeQuestions,
  type QuestionsFilter,
} from "@/functions/offerQuestions";
import { ForbiddenError, ValidationError } from "@/services/errors";
import {
  offerQuestionsService,
  OfferQuestionsUnavailableError,
} from "@/services/offerQuestions.service";

import { SellerQuestionsProps } from "./interface";

const INITIAL_FILTER: QuestionsFilter = {
  search: "",
  offeringId: "",
  status: "all",
};

function answerError(error: unknown): string {
  if (error instanceof OfferQuestionsUnavailableError) {
    return "SellerQuestions.answer.errors.unavailable";
  }
  if (error instanceof ForbiddenError) {
    return "SellerQuestions.answer.errors.forbidden";
  }
  if (error instanceof ValidationError) {
    return "SellerQuestions.answer.errors.blocked";
  }
  return "SellerQuestions.answer.errors.failed";
}

/**
 * "Perguntas recebidas" do seller (Figma 2951-60629, 2951-62746 e
 * 2951-63078): contadores, quem pode responder, filtros e as perguntas
 * públicas das ofertas, com o campo de resposta nas que estão sem resposta.
 */
export function SellerQuestions({
  questions: initialQuestions,
  locale,
  answer = offerQuestionsService.answer,
}: SellerQuestionsProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = React.useState(initialQuestions);
  const [filter, setFilter] = React.useState(INITIAL_FILTER);

  const summary = summarizeQuestions(questions);
  const visible = filterQuestions(questions, filter);
  const offerings = Array.from(
    new Map(
      questions.map((item) => [
        item.offeringId,
        { id: item.offeringId, name: item.offeringName },
      ]),
    ).values(),
  );

  const stats = [
    { key: "unanswered", value: summary.unanswered, color: "#D97706" },
    { key: "answered", value: summary.answered, color: "#10B981" },
    {
      key: "responseRate",
      value: new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 0,
      }).format(summary.responseRate),
      color: "#8B5CF6",
    },
  ];

  const publish = async (
    questionId: string,
    text: string,
  ): Promise<AnswerResult> => {
    try {
      const published = await answer(questionId, text);
      setQuestions((current) =>
        current.map((item) =>
          item.id === questionId ? { ...item, answer: published } : item,
        ),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, errorKey: answerError(error) };
    }
  };

  let list: React.ReactNode;
  if (questions.length === 0 || visible.length === 0) {
    list = (
      <Flex
        align="center"
        justify="center"
        py="28px"
        px="20px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="12px"
        textAlign="center"
      >
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t(
            questions.length === 0
              ? "SellerQuestions.empty"
              : "SellerQuestions.emptyFiltered",
          )}
        </Text>
      </Flex>
    );
  } else {
    list = (
      <Stack gap="16px">
        {visible.map((question) => (
          <OfferQuestionCard
            key={question.id}
            question={question}
            locale={locale}
            onAnswer={publish}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("SellerQuestions.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("SellerQuestions.subtitle")}
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="12px">
        {stats.map((stat) => (
          <Stack
            key={stat.key}
            gap="4px"
            px="16px"
            py="12px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="12px"
          >
            <Text
              color="#A0ABB8"
              fontSize="9.5px"
              fontWeight={700}
              lineHeight="14.25px"
              letterSpacing="0.475px"
              textTransform="uppercase"
            >
              {t(`SellerQuestions.stats.${stat.key}`)}
            </Text>
            <Text
              color={stat.color}
              fontSize="22px"
              fontWeight={800}
              lineHeight="33px"
            >
              {stat.value}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Flex
        align="flex-start"
        gap="12px"
        p="16px"
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="12px"
      >
        <Icon
          as={LuShieldCheck}
          boxSize="15px"
          mt="2px"
          color="#1F5AFF"
          flexShrink={0}
        />
        <Stack gap="4px">
          <Text
            color="#1F5AFF"
            fontSize="12px"
            fontWeight={700}
            lineHeight="18px"
          >
            {t("SellerQuestions.whoCanAnswer.title")}
          </Text>
          <Text color="#5A7CE0" fontSize="11px" lineHeight="16.5px">
            {t("SellerQuestions.whoCanAnswer.description")}
          </Text>
        </Stack>
      </Flex>

      <SellerQuestionsFilters
        value={filter}
        onChange={setFilter}
        offerings={offerings}
        counts={{ unanswered: summary.unanswered, answered: summary.answered }}
      />

      {list}
    </Stack>
  );
}
