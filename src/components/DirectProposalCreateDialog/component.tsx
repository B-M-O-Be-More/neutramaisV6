"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { LuCircleCheck, LuSend, LuShield } from "react-icons/lu";

import FormDirectProposal, {
  type DirectProposalValues,
} from "@/components/Forms/FormDirectProposal";
import { OFFER_CATEGORY_PALETTE } from "@/components/MarketplaceOfferCard/categories";
import ProposalsDialogFrame, {
  PROPOSALS_DIALOG_BUTTONS,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";
import { toaster } from "@/components/ui/toaster";
import type { SentDirectProposal } from "@/hooks/useSendDirectProposal";
import { parseDecimal } from "@/functions/parseDecimal";

import { DirectProposalCreateDialogProps } from "./interface";

type Step = "form" | "review" | "done";

const PURPLE = "#8B5CF6";

const PRIMARY = {
  ...PROPOSALS_DIALOG_BUTTONS.primary,
  minH: "47px",
  bg: PURPLE,
  _hover: { bg: "#7C4DEB" },
  boxShadow: "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)",
} as const;

const SECONDARY = {
  ...PROPOSALS_DIALOG_BUTTONS.secondary,
  minH: "47px",
  color: "#5A6478",
} as const;

/** Bloco da revisão: rótulo em caixa alta e valor (Figma 2456-33696). */
function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      gap="2px"
      px="12px"
      py="10px"
      bg="#F8F9FB"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="10px"
      minW={0}
    >
      <Text
        as="dt"
        color="#8A9AB5"
        fontSize="9px"
        fontWeight={700}
        lineHeight="13.5px"
        letterSpacing="0.45px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text
        as="dd"
        color="#0F1729"
        fontSize="13px"
        fontWeight={600}
        lineHeight="19.5px"
        overflowWrap="anywhere"
      >
        {value}
      </Text>
    </Stack>
  );
}

/** Dado do protocolo na tela de sucesso (Figma 2456-35186). */
function ReceiptItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="0" minW={0}>
      <Text
        as="dt"
        color="#8A9AB5"
        fontSize="9px"
        fontWeight={700}
        lineHeight="13.5px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text
        as="dd"
        color="#0F1729"
        fontSize="13px"
        fontWeight={700}
        lineHeight="19.5px"
      >
        {value}
      </Text>
    </Stack>
  );
}

/**
 * "Fazer Proposta" de uma oferta do Buscar Rede: formulário (Figma
 * 2456-32149 e 2456-36945), revisão (2456-33696) e confirmação (2456-35186).
 * A proposta vai para o seller da oferta, em BRL, na versão v1.
 */
export function DirectProposalCreateDialog({
  offer,
  buyerName,
  defaultAddress,
  locale,
  proposalsHref,
  onClose,
  onSend,
}: DirectProposalCreateDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = React.useState<Step>("form");
  const [draft, setDraft] = React.useState<Partial<DirectProposalValues>>(
    () => ({
      street: defaultAddress?.street ?? "",
      postalCode: defaultAddress?.postalCode ?? "",
      ports: offer?.minPorts,
      contractMonths: offer?.contractMonths,
    }),
  );
  const [sent, setSent] = React.useState<SentDirectProposal | null>(null);
  const [isSending, setSending] = React.useState(false);

  if (!offer) return null;

  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  });
  const values = draft as DirectProposalValues;

  const handleSend = async () => {
    setSending(true);
    try {
      setSent(await onSend(offer.id, values));
      setStep("done");
    } catch {
      toaster.create({
        type: "error",
        title: t("SearchNetwork.proposal.errors.sendFailed"),
      });
    } finally {
      setSending(false);
    }
  };

  const subtitle = t("SearchNetwork.proposal.subtitle", {
    product: offer.title,
  });

  let body: React.ReactNode;
  let footer: React.ReactNode;

  if (step === "form") {
    body = (
      <Stack gap="24px">
        <Box
          position="relative"
          h="144px"
          overflow="hidden"
          rounded="14px"
          bgImage={OFFER_CATEGORY_PALETTE.connectivity.gradient}
        >
          <Box
            aria-hidden
            position="absolute"
            inset={0}
            bgImage="linear-gradient(to top, rgba(15,23,41,0.8), rgba(15,23,41,0))"
          />
          <Stack
            position="absolute"
            left={0}
            bottom={0}
            gap="0"
            px="20px"
            py="16px"
          >
            <Text
              color="white"
              fontSize="16px"
              fontWeight={800}
              lineHeight="24px"
            >
              {offer.title}
            </Text>
            <Text
              color="rgba(255,255,255,0.7)"
              fontSize="13px"
              lineHeight="19.5px"
            >
              {offer.subtitle}
            </Text>
          </Stack>
        </Box>
        <FormDirectProposal
          minPorts={offer.minPorts}
          defaultValues={draft}
          locale={locale}
          onCancel={onClose}
          onSubmit={(next) => {
            setDraft(next);
            setStep("review");
          }}
        />
      </Stack>
    );
  } else if (step === "review") {
    const price = parseDecimal(values.price) ?? 0;
    const rows: [string, string][] = [
      ["buyer", buyerName],
      ["product", offer.title],
      [
        "address",
        t("SearchNetwork.proposal.summary.addressValue", {
          street: values.street,
          number: values.number,
          postalCode: values.postalCode,
        }),
      ],
      ["ports", String(values.ports)],
      [
        "contract",
        t("SearchNetwork.proposal.summary.months", {
          count: values.contractMonths,
        }),
      ],
      ["price", money.format(price)],
      ["sla", values.sla],
      ["delivery", values.delivery],
      ["cancellation", values.cancellation],
      [
        "siteSurvey",
        t(
          values.requiresSiteSurvey
            ? "SearchNetwork.proposal.summary.surveyRequired"
            : "SearchNetwork.proposal.summary.surveyNotRequired",
        ),
      ],
    ];
    if (values.message) rows.push(["message", values.message]);
    if (values.attachments.length) {
      rows.push([
        "attachments",
        values.attachments.map((file) => file.name).join(", "),
      ]);
    }

    body = (
      <Stack gap="16px">
        <ProposalsNotice tone="warning">
          {t("SearchNetwork.proposal.reviewNotice")}
        </ProposalsNotice>
        <SimpleGrid as="dl" columns={{ base: 1, sm: 2 }} gap="14px">
          {rows.map(([key, value]) => (
            <SummaryTile
              key={key}
              label={t(`SearchNetwork.proposal.summary.${key}`)}
              value={value}
            />
          ))}
        </SimpleGrid>
        <ProposalsNotice tone="info" icon={LuShield}>
          <Trans
            i18nKey="SearchNetwork.proposal.acceptance"
            components={{ strong: <strong /> }}
          />
        </ProposalsNotice>
      </Stack>
    );
    footer = (
      <>
        <Button
          {...SECONDARY}
          disabled={isSending}
          onClick={() => setStep("form")}
        >
          {t("SearchNetwork.proposal.edit")}
        </Button>
        <Button {...PRIMARY} loading={isSending} onClick={handleSend}>
          <Icon as={LuSend} boxSize="15px" />
          {t("SearchNetwork.proposal.confirm")}
        </Button>
      </>
    );
  } else if (sent) {
    body = (
      <Stack align="center" gap="20px" py="24px" textAlign="center">
        <Flex
          align="center"
          justify="center"
          boxSize="52px"
          bg="#EDFBF5"
          rounded="14px"
        >
          <Icon as={LuCircleCheck} boxSize="26px" color="#10B981" aria-hidden />
        </Flex>
        <Stack gap="6px">
          <Text
            color="#0F1729"
            fontSize="18px"
            fontWeight={800}
            lineHeight="27px"
          >
            {t("SearchNetwork.proposal.done.heading")}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("SearchNetwork.proposal.done.description", {
              count: sent.responseHours,
            })}
          </Text>
        </Stack>
        <SimpleGrid
          as="dl"
          columns={2}
          columnGap="24px"
          rowGap="12px"
          w="full"
          maxW="360px"
          px="16px"
          py="16px"
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="12px"
          textAlign="left"
        >
          <ReceiptItem
            label={t("SearchNetwork.proposal.done.id")}
            value={sent.id}
          />
          <ReceiptItem
            label={t("SearchNetwork.proposal.done.status")}
            value={t("SearchNetwork.proposal.done.statusValue")}
          />
          <ReceiptItem
            label={t("SearchNetwork.proposal.done.version")}
            value={`v${sent.version}`}
          />
          <ReceiptItem
            label={t("SearchNetwork.proposal.done.validity")}
            value={t("SearchNetwork.proposal.done.days", {
              count: sent.validityDays,
            })}
          />
        </SimpleGrid>
        <Flex
          gap="12px"
          w="full"
          maxW="360px"
          direction={{ base: "column-reverse", sm: "row" }}
        >
          <Button {...SECONDARY} minH="37px" onClick={onClose}>
            {t("SearchNetwork.proposal.done.close")}
          </Button>
          <Button {...PRIMARY} asChild minH="37px">
            <NextLink href={proposalsHref}>
              {t("SearchNetwork.proposal.done.viewSent")}
            </NextLink>
          </Button>
        </Flex>
      </Stack>
    );
  }

  return (
    <ProposalsDialogFrame
      open
      onClose={onClose}
      isBusy={isSending}
      closeTone="filled"
      maxW="896px"
      title={t(`SearchNetwork.proposal.titles.${step}`)}
      subtitle={step === "done" ? undefined : subtitle}
      footer={footer}
    >
      {body}
    </ProposalsDialogFrame>
  );
}
