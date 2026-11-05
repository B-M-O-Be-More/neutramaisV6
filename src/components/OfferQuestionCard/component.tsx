"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuClock, LuSend } from "react-icons/lu";

import {
  ANSWER_MAX_LENGTH,
  hasBlockedContent,
  responseHours,
} from "@/functions/offerQuestions";

import { OfferQuestionCardProps } from "./interface";

const STATUS = {
  unanswered: { color: "#D97706", bg: "#FFFBEB" },
  answered: { color: "#10B981", bg: "#EDFBF5" },
} as const;

function formatDate(iso: string, locale: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}

/**
 * Pergunta pública numa oferta (Figma 2951-62806 e 2951-65067): a oferta, a
 * pergunta do "comprador verificado" e, conforme a situação, o campo de
 * resposta ou a resposta pública do seller com o tempo que levou.
 */
export function OfferQuestionCard({
  question,
  locale,
  onAnswer,
}: OfferQuestionCardProps) {
  const { t } = useTranslation();
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const status = question.answer ? "answered" : "unanswered";
  const fieldId = `question-answer-${question.id}`;
  const hours = responseHours(question);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const answer = text.trim();
    if (!answer) {
      setError("SellerQuestions.answer.errors.required");
      return;
    }
    if (hasBlockedContent(answer)) {
      setError("SellerQuestions.answer.errors.blocked");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await onAnswer(question.id, answer);
    setSubmitting(false);
    if (result.ok) setText("");
    else setError(result.errorKey);
  };

  return (
    <Stack
      as="article"
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Flex align="flex-start" justify="space-between" gap="12px">
        <Stack gap="8px" minW={0}>
          <Text
            color="#8B5CF6"
            fontSize="10px"
            fontWeight={700}
            lineHeight="15px"
            letterSpacing="0.5px"
            textTransform="uppercase"
          >
            {question.offeringName}
          </Text>
          <Text
            as="h2"
            color="#0F1729"
            fontSize="13px"
            fontWeight={600}
            lineHeight="21px"
          >
            {question.question}
          </Text>
          <Text color="#8A9AB5" fontSize="10px" lineHeight="15px">
            {[
              t("SellerQuestions.verifiedBuyer"),
              formatDate(question.askedAt, locale),
              question.protocol,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </Stack>
        <Box
          flexShrink={0}
          px="10px"
          py="4px"
          bg={STATUS[status].bg}
          rounded="8px"
          color={STATUS[status].color}
          fontSize="10px"
          fontWeight={700}
          lineHeight="15px"
        >
          {t(`SellerQuestions.status.${status}`)}
        </Box>
      </Flex>

      {question.answer ? (
        <Stack
          gap="0"
          p="16px"
          bg="#F8F5FF"
          borderLeftWidth="2px"
          borderColor="#8B5CF6"
          rounded="12px"
        >
          <Text
            color="#8B5CF6"
            fontSize="10px"
            fontWeight={700}
            lineHeight="15px"
          >
            {t("SellerQuestions.answer.publicTitle")}
          </Text>
          <Text pt="6px" color="#5A6478" fontSize="12px" lineHeight="19.5px">
            {question.answer.text}
          </Text>
          <Flex align="center" gap="4px" pt="8px" color="#8A9AB5">
            <Icon as={LuClock} boxSize="9px" />
            <Text fontSize="9px" lineHeight="13.5px">
              {[
                hours === null
                  ? null
                  : t("SellerQuestions.answer.answeredIn", {
                      hours: new Intl.NumberFormat(locale, {
                        maximumFractionDigits: 1,
                      }).format(hours),
                    }),
                formatDate(question.answer.answeredAt, locale),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </Flex>
        </Stack>
      ) : (
        <Stack
          asChild
          gap="8px"
          pt="16px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <form noValidate onSubmit={submit}>
            <Box position="relative">
              <Textarea
                id={fieldId}
                aria-label={t("SellerQuestions.answer.label")}
                aria-invalid={!!error}
                aria-describedby={`${fieldId}-hint`}
                value={text}
                maxLength={ANSWER_MAX_LENGTH}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) setError(null);
                }}
                placeholder={t("SellerQuestions.answer.placeholder")}
                disabled={isSubmitting}
                h="80px"
                p="12px"
                pb="24px"
                bg="#F8F9FB"
                borderWidth="1px"
                borderColor={error ? "#FECACA" : "#E5E8EE"}
                rounded="12px"
                color="#0F1729"
                fontSize="12px"
                lineHeight="18px"
                resize="none"
                _placeholder={{ color: "rgba(9,9,11,0.5)" }}
              />
              <Text
                position="absolute"
                right="12px"
                bottom="8px"
                color="#A0ABB8"
                fontSize="9px"
                lineHeight="13.5px"
                aria-hidden
              >
                {text.length}/{ANSWER_MAX_LENGTH}
              </Text>
            </Box>
            <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
              <Text
                id={`${fieldId}-hint`}
                role={error ? "alert" : undefined}
                color={error ? "#EF4444" : "#8A9AB5"}
                fontSize="9px"
                lineHeight="13.5px"
              >
                {t(error ?? "SellerQuestions.answer.hint")}
              </Text>
              <Button
                type="submit"
                h="33px"
                px="16px"
                gap="6px"
                bg="#8B5CF6"
                rounded="8px"
                color="white"
                fontSize="11px"
                fontWeight={700}
                _hover={{ bg: "#7C4DEB" }}
                loading={isSubmitting}
              >
                <Icon as={LuSend} boxSize="12px" />
                {t("SellerQuestions.answer.publish")}
              </Button>
            </Flex>
          </form>
        </Stack>
      )}
    </Stack>
  );
}
