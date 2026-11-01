"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronRight, LuCircleCheck, LuSend } from "react-icons/lu";

import FormRfqDetails, {
  type RfqDetailsValues,
} from "@/components/Forms/FormRfqDetails";
import ProposalsDialogFrame, {
  PROPOSALS_DIALOG_BUTTONS,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";
import ProposalsTermsTable from "@/components/ProposalsTermsTable";
import RfqCategoryPicker from "@/components/RfqCategoryPicker";
import RfqReviewSummary from "@/components/RfqReviewSummary";
import {
  DEFAULT_RFQ_RESPONSE_HOURS,
  type QuoteCategory,
  type Rfq,
  type RfqDraft,
  type RfqResponseHours,
} from "@/types/proposals";

import { RfqCreateDialogProps } from "./interface";

type WizardStep = "category" | "details" | "review" | "done";

const STEPS = ["category", "details", "review"] as const;

const EMPTY_DETAILS: RfqDetailsValues = {
  productName: "",
  description: "",
  location: "",
  budget: "",
  responseHours: DEFAULT_RFQ_RESPONSE_HOURS,
  urgent: false,
  requirements: "",
};

/** Indicador das etapas: alcançadas em azul, a atual em negrito. */
function WizardSteps({ current }: { current: number }) {
  const { t } = useTranslation();

  return (
    <Flex as="ol" align="center" gap="8px" listStyleType="none">
      {STEPS.map((step, index) => {
        const isReached = index <= current;
        const isCurrent = index === current;
        const isLast = index === STEPS.length - 1;
        // As linhas ficam com a etapa do meio: antes e depois dela.
        const isMiddle = index === 1;
        const circle = (
          <Flex
            align="center"
            justify="center"
            boxSize="24px"
            flexShrink={0}
            rounded="full"
            bg={isReached ? "#1F5AFF" : "#E5E8EE"}
            color="white"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
          >
            {index + 1}
          </Flex>
        );
        const label = (
          <Text
            color={isReached ? "#1F5AFF" : "#A0ABB8"}
            fontSize="11px"
            fontWeight={isCurrent ? 700 : 400}
            lineHeight="16.5px"
            whiteSpace="nowrap"
            display={{ base: isCurrent ? "block" : "none", sm: "block" }}
          >
            {t(`Proposals.rfq.create.steps.${step}`)}
          </Text>
        );

        return (
          <Flex
            as="li"
            key={step}
            align="center"
            gap="8px"
            flex={isMiddle ? "1" : undefined}
            minW={0}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isMiddle && (
              <Box
                flex="1"
                h="1px"
                minW="12px"
                bg={isReached ? "#1F5AFF" : "#E5E8EE"}
              />
            )}
            {isLast ? (
              <>
                {label}
                {circle}
              </>
            ) : (
              <>
                {circle}
                {label}
              </>
            )}
            {isMiddle && (
              <Box
                flex="1"
                h="1px"
                minW="12px"
                bg={current > 1 ? "#1F5AFF" : "#E5E8EE"}
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

/**
 * Assistente de nova RFQ (Figma 2073-40139, 2042-24288, 2042-23286 e
 * 2042-30484): categoria, detalhes, revisão e confirmação. A RFQ vai para
 * todos os sellers elegíveis da categoria.
 */
export function RfqCreateDialog({
  open,
  nextId,
  initial,
  onClose,
  onCreate,
}: RfqCreateDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = React.useState<WizardStep>(
    initial ? "details" : "category",
  );
  const [category, setCategory] = React.useState<QuoteCategory | null>(
    initial?.category ?? null,
  );
  const [details, setDetails] = React.useState<RfqDetailsValues>(
    initial ?? EMPTY_DETAILS,
  );
  const [created, setCreated] = React.useState<Rfq | null>(null);
  const [isSending, setSending] = React.useState(false);

  const draft: RfqDraft | null = category
    ? {
        ...details,
        category,
        responseHours: details.responseHours as RfqResponseHours,
      }
    : null;

  const handleSend = async () => {
    if (!draft) return;
    setSending(true);
    try {
      setCreated(await onCreate(draft));
      setStep("done");
    } finally {
      setSending(false);
    }
  };

  const isDone = step === "done";

  return (
    <ProposalsDialogFrame
      open={open}
      onClose={onClose}
      isBusy={isSending}
      closeTone={isDone ? "filled" : "plain"}
      title={t(`Proposals.rfq.create.titles.${step}`)}
      footer={
        step === "review" ? (
          <>
            <Button
              {...PROPOSALS_DIALOG_BUTTONS.secondary}
              minH="47px"
              disabled={isSending}
              onClick={() => setStep("details")}
            >
              {t("Proposals.dialog.back")}
            </Button>
            <Button
              {...PROPOSALS_DIALOG_BUTTONS.primary}
              minH="47px"
              boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
              loading={isSending}
              onClick={handleSend}
            >
              {t("Proposals.rfq.create.send")}
              <Icon as={LuSend} boxSize="15px" />
            </Button>
          </>
        ) : undefined
      }
    >
      {!isDone && (
        <Box pb="24px">
          <WizardSteps current={STEPS.indexOf(step)} />
        </Box>
      )}

      {step === "category" && (
        <Stack gap="16px">
          <RfqCategoryPicker value={category} onChange={setCategory} />
          <Flex justify="flex-end" pt="8px">
            <Button
              h="45px"
              px="24px"
              gap="8px"
              rounded="14px"
              bg="#1F5AFF"
              color="white"
              fontSize="14px"
              fontWeight={700}
              _hover={{ bg: "#1646CC" }}
              _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
              disabled={!category}
              onClick={() => setStep("details")}
            >
              {t("Proposals.rfq.create.next")}
              <Icon as={LuChevronRight} boxSize="15px" />
            </Button>
          </Flex>
        </Stack>
      )}

      {step === "details" && category && (
        <FormRfqDetails
          category={category}
          defaultValues={details}
          onChangeCategory={() => setStep("category")}
          onBack={() => setStep("category")}
          onSubmit={(values) => {
            setDetails(values);
            setStep("review");
          }}
        />
      )}

      {step === "review" && draft && (
        <Stack gap="20px">
          <ProposalsNotice tone="warning">
            {t("Proposals.rfq.create.reviewNotice")}
          </ProposalsNotice>
          <RfqReviewSummary draft={draft} rfqId={nextId} />
        </Stack>
      )}

      {isDone && created && (
        <Stack gap="20px" align="center" py="16px">
          <Flex
            align="center"
            justify="center"
            boxSize="64px"
            rounded="full"
            bg="#EEF3FF"
            borderWidth="2px"
            borderColor="#1F5AFF"
          >
            <Icon as={LuSend} boxSize="28px" color="#1F5AFF" aria-hidden />
          </Flex>
          <Stack gap="4px" textAlign="center">
            <Text
              color="#1F5AFF"
              fontSize="22px"
              fontWeight={800}
              lineHeight="33px"
            >
              {t("Proposals.rfq.create.done.heading")}
            </Text>
            <Text color="#5A7CE0" fontSize="14px" lineHeight="21px">
              {t("Proposals.rfq.create.done.description", {
                count: created.responseHours,
              })}
            </Text>
          </Stack>
          <Box w="full">
            <ProposalsTermsTable
              density="compact"
              rows={[
                {
                  key: "id",
                  label: t("Proposals.rfq.create.done.id"),
                  value: created.id,
                },
                {
                  key: "product",
                  label: t("Proposals.rfq.create.done.product"),
                  value: created.productName,
                },
                {
                  key: "deadline",
                  label: t("Proposals.rfq.create.done.deadline"),
                  value: t(
                    created.urgent
                      ? "Proposals.rfq.create.summary.deadlineUrgent"
                      : "Proposals.rfq.create.summary.deadlineValue",
                    { count: created.responseHours },
                  ),
                },
                {
                  key: "status",
                  label: t("Proposals.rfq.create.done.status"),
                  value: t("Proposals.rfq.create.done.statusValue"),
                },
              ]}
            />
          </Box>
          <Flex align="center" gap="8px" color="#10B981">
            <Icon as={LuCircleCheck} boxSize="13px" aria-hidden />
            <Text fontSize="12px" lineHeight="18px">
              {t("Proposals.rfq.create.done.notify")}
            </Text>
          </Flex>
          <Button
            w="full"
            h="39px"
            rounded="14px"
            bg="#1646CC"
            color="white"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
            boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
            _hover={{ bg: "#1238A8" }}
            onClick={onClose}
          >
            {t("Proposals.rfq.create.finish")}
          </Button>
        </Stack>
      )}
    </ProposalsDialogFrame>
  );
}
