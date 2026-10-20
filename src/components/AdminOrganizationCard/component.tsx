"use client";

import { Box, Button, chakra, Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuBan,
  LuChevronDown,
  LuCircleCheck,
  LuCirclePlay,
  LuCircleX,
  LuClock,
  LuEye,
  LuFileSearch,
  LuFileWarning,
  LuTriangleAlert,
  LuUsers,
} from "react-icons/lu";

import { formatTaxId } from "@/functions/formatTaxId";
import type {
  AdminOrganizationType,
  KycQueueItem,
  KycQueueStatusFilter,
} from "@/services/admin.service";

import { AdminOrganizationCardProps } from "./interface";

// Cores do tipo de organização: avatar e etiqueta.
const TYPE_COLORS: Record<
  AdminOrganizationType,
  { fg: string; bg: string; border: string }
> = {
  seller: { fg: "#8B5CF6", bg: "#F3EEFF", border: "#D3BFFD" },
  buyer: { fg: "#1F5AFF", bg: "#EEF3FF", border: "#C7D8FF" },
};

const AMBER = { fg: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
const RED = { fg: "#EF4444", bg: "#FEF2F2", border: "#FECACA" };
const GREEN = { fg: "#10B981", bg: "#EDFBF5", border: "#AAECD5" };
const BLUE = { fg: "#1F5AFF", bg: "#EEF3FF", border: "#C7D8FF" };
const GRAY = { fg: "#5A6478", bg: "#F4F6F9", border: "#E5E8EE" };

// Situação exibida na pílula. As flags de revisão têm prioridade sobre o
// status da solicitação.
const STATUS_STYLES: Record<
  KycQueueStatusFilter,
  { icon: IconType; fg: string; bg: string; border: string }
> = {
  pendente: { icon: LuClock, ...GRAY },
  enviado: { icon: LuClock, ...AMBER },
  em_revisao: { icon: LuFileSearch, ...BLUE },
  revisao_especial: { icon: LuTriangleAlert, ...RED },
  correcao_solicitada: { icon: LuFileWarning, ...AMBER },
  aprovado: { icon: LuCircleCheck, ...GREEN },
  recusado: { icon: LuCircleX, ...RED },
  suspenso: { icon: LuBan, ...RED },
};

function displayStatus(request: KycQueueItem): KycQueueStatusFilter {
  if (request.flags?.revisao_especial) return "revisao_especial";
  if (request.flags?.em_revisao) return "em_revisao";
  return request.status;
}

/**
 * Solicitação na fila de KYC do painel administrativo (Figma 2593-78105).
 * Clicar no cabeçalho expande as ações de revisão.
 */
export function AdminOrganizationCard({
  request,
  expanded,
  onToggle,
}: AdminOrganizationCardProps) {
  const { t, i18n } = useTranslation();
  const type = TYPE_COLORS[request.organization_type] ?? TYPE_COLORS.buyer;
  const statusKey = displayStatus(request);
  const status = STATUS_STYLES[statusKey] ?? STATUS_STYLES.pendente;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "short",
          timeStyle: "short",
        }).format(date);
  };
  const dateLabel = request.submitted_at
    ? t("Admin.organization.submittedAt", {
        date: formatDate(request.submitted_at),
      })
    : t("Admin.organization.registeredAt", {
        date: formatDate(request.registered_at),
      });

  // Só os alertas ativos aparecem (ex.: "nao_verificado" fica de fora).
  const activeAlerts = (request.alerts ?? []).filter(
    (alert) => alert.status === "ativo",
  );
  const level = request.requested_level ?? request.kyc_level;
  const { documents } = request;
  const detailsId = `admin-kyc-${request.organization_id}`;

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor={expanded ? "#C7D8FF" : "#E5E8EE"}
      rounded="14px"
      overflow="hidden"
      transition="border-color 0.15s"
    >
      <chakra.button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={detailsId}
        display="flex"
        flexWrap={{ base: "wrap", md: "nowrap" }}
        alignItems="flex-start"
        gap="16px"
        w="full"
        p="20px"
        textAlign="start"
        cursor="pointer"
        _focusVisible={{ outline: "2px solid #1F5AFF", outlineOffset: "-2px" }}
      >
        <Flex
          boxSize="40px"
          align="center"
          justify="center"
          rounded="14px"
          bg={type.bg}
          borderWidth="1px"
          borderColor={type.border}
          flexShrink={0}
        >
          <Icon as={LuUsers} boxSize="16px" color={type.fg} />
        </Flex>

        <Box flex="1" minW={0}>
          <Flex align="center" gap="8px" wrap="wrap">
            <Text
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
              truncate
            >
              {request.organization_name}
            </Text>
            <Text
              as="span"
              px="8px"
              py="2px"
              rounded="8px"
              bg={type.bg}
              color={type.fg}
              fontSize="10px"
              fontWeight={700}
              lineHeight="15px"
              textTransform="uppercase"
              flexShrink={0}
            >
              {t(`Admin.organization.types.${request.organization_type}`)}
            </Text>
          </Flex>
          <Text pt="2px" color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {formatTaxId(request.tax_id, request.tax_id_kind)} ·{" "}
            {request.request_id} · {dateLabel}
          </Text>

          {activeAlerts.length > 0 && (
            <Flex gap="4px" wrap="wrap" pt="6px">
              {activeAlerts.map((alert) => (
                <Flex
                  key={alert.code}
                  align="center"
                  gap="4px"
                  px="8px"
                  py="2px"
                  rounded="8px"
                  bg={RED.bg}
                  borderWidth="1px"
                  borderColor={RED.border}
                  color={RED.fg}
                >
                  <Icon as={LuTriangleAlert} boxSize="10px" />
                  <Text fontSize="10px" fontWeight={600} lineHeight="15px">
                    {t(`Admin.organization.alerts.${alert.code}`, {
                      defaultValue: alert.code,
                    })}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>

        <Flex
          direction="column"
          align={{ base: "flex-start", md: "flex-end" }}
          gap="8px"
          flexShrink={0}
          ms={{ base: "56px", md: 0 }}
        >
          <Flex align="center" gap="8px">
            <Flex
              align="center"
              gap="6px"
              px="12px"
              py="4px"
              rounded="10px"
              bg={status.bg}
              borderWidth="1px"
              borderColor={status.border}
              color={status.fg}
            >
              <Icon as={status.icon} boxSize="11px" />
              <Text fontSize="12px" fontWeight={600} lineHeight="18px">
                {t(`Admin.organization.status.${statusKey}`)}
              </Text>
            </Flex>
            <Flex
              boxSize="24px"
              align="center"
              justify="center"
              rounded="8px"
              bg={expanded ? "#EEF3FF" : "#F4F6F9"}
              color={expanded ? "#1F5AFF" : "#8A9AB5"}
              aria-hidden
            >
              <Icon
                as={LuChevronDown}
                boxSize="12px"
                transform={expanded ? "rotate(180deg)" : undefined}
                transition="transform 0.15s"
              />
            </Flex>
          </Flex>
          <Text
            color="#A0ABB8"
            fontSize="11px"
            lineHeight="16.5px"
            css={{ fontVariantNumeric: "tabular-nums" }}
          >
            {t("Admin.organization.level")}{" "}
            <Text as="span" color="#5A6478" fontWeight={700}>
              {t(`Admin.organization.levels.${level}`)}
            </Text>
            {" · "}
            {t("Admin.organization.documents", {
              sent: documents?.sent ?? 0,
              required: documents?.required ?? 0,
            })}
            {documents?.pending ? (
              <Text as="span" color={RED.fg} fontWeight={600}>
                {" "}
                {t("Admin.organization.pendingDocuments", {
                  count: documents.pending,
                })}
              </Text>
            ) : null}
          </Text>
        </Flex>
      </chakra.button>

      {expanded && (
        <Flex
          id={detailsId}
          align="center"
          justify="space-between"
          gap="12px"
          wrap="wrap"
          px="20px"
          py="16px"
          bg="#F8F9FB"
          borderTopWidth="1px"
          borderColor="#F0F2F7"
        >
          {/* As ações dependem dos endpoints de documentos e revisão do admin
              (/admin/kyc/{organization_id}/...), ainda não ligados. */}
          <Button
            type="button"
            variant="outline"
            disabled
            h="38px"
            px="12px"
            gap="6px"
            rounded="10px"
            bg="white"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontSize="13px"
            fontWeight={500}
            title={t("Admin.organization.actions.soon")}
          >
            <Icon as={LuEye} boxSize="13px" />
            {t("Admin.organization.actions.viewDocuments")}
          </Button>
          <Button
            type="button"
            disabled
            h="38px"
            px="12px"
            gap="6px"
            rounded="10px"
            bg="#1F5AFF"
            color="white"
            fontSize="13px"
            fontWeight={700}
            _hover={{ bg: "#1A4FE0" }}
            title={t("Admin.organization.actions.soon")}
          >
            <Icon as={LuCirclePlay} boxSize="13px" />
            {t("Admin.organization.actions.startReview")}
          </Button>
        </Flex>
      )}
    </Box>
  );
}
