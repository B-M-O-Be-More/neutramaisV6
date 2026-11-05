"use client";

import { Button, Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuArrowRight } from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ReturnAttachments from "@/components/ReturnAttachments";
import ReturnFreight from "@/components/ReturnFreight";
import ReturnRequestSummary from "@/components/ReturnRequestSummary";
import ReturnsBackLink from "@/components/ReturnsBackLink";
import ReturnSlaBanner from "@/components/ReturnSlaBanner";
import ReturnStatusBadge from "@/components/ReturnStatusBadge";
import ReturnTimeline from "@/components/ReturnTimeline";
import { toaster } from "@/components/ui/toaster";
import { useReturns } from "@/contexts/ReturnsContext";
import { RETURN_MEDIATION_STATUSES } from "@/data/returnStatus";
import { currencyLocale } from "@/functions/currencyLocale";
import { returnSlaHours } from "@/functions/returnSla";

function ReturnDetailContent({ returnId }: { returnId: string }) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { returns, now, pendingId, requestMediation } = useReturns();
  const item = returns.find((entry) => entry.id === returnId);

  if (!item) {
    return (
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "28px" }}
        gap="16px"
      >
        <ReturnsBackLink label={t("Returns.detail.back")} />
        <Text color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("Returns.detail.notFound")}
        </Text>
      </Stack>
    );
  }

  const slaHours = returnSlaHours(item, now);
  const canMediate = RETURN_MEDIATION_STATUSES.includes(item.status);

  const handleMediation = async () => {
    const ok = await requestMediation(item.id);
    toaster.create(
      ok
        ? {
            type: "success",
            title: t("Returns.toasts.mediationRequested"),
            description: t("Returns.toasts.mediationRequestedDescription"),
          }
        : { type: "error", title: t("Returns.toasts.actionFailed") },
    );
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <ReturnsBackLink label={t("Returns.detail.back")} />

      <Flex
        direction={{ base: "column", sm: "row" }}
        align="flex-start"
        justify="space-between"
        gap="12px"
      >
        <Stack gap="4px" minW={0}>
          <Text
            as="h1"
            color="#0F1729"
            fontSize="22px"
            fontWeight={800}
            lineHeight="33px"
          >
            {t("Returns.productWithQuantity", {
              name: item.productName,
              count: item.quantity,
            })}
          </Text>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {[
              item.id,
              item.orderId,
              t(`Returns.types.${item.type}.label`),
            ].join(" · ")}
          </Text>
        </Stack>
        <ReturnStatusBadge status={item.status} size="md" />
      </Flex>

      {slaHours !== null && <ReturnSlaBanner hours={slaHours} />}

      <Grid
        templateColumns={{
          base: "1fr",
          lg: "minmax(0, 612fr) minmax(0, 350fr)",
        }}
        gap="20px"
        alignItems="start"
      >
        <Stack gap="20px" minW={0}>
          <ReturnRequestSummary item={item} locale={locale} />
          <ReturnAttachments attachments={item.attachments} />
        </Stack>

        <Stack gap="16px" minW={0}>
          <ReturnFreight reason={item.reason} />
          <ReturnTimeline status={item.status} />
          {/* Só contestada ou recusada vai à mediação (Figma 2943-31619). */}
          <Button
            h="40px"
            px="12px"
            gap="8px"
            bg="#1F5AFF"
            rounded="10px"
            color="white"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
            _hover={{ bg: "#1646CC" }}
            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
            disabled={!canMediate}
            loading={pendingId === item.id}
            onClick={handleMediation}
          >
            {t("Returns.detail.mediation")}
            <Icon as={LuArrowRight} boxSize="13px" />
          </Button>
          {!canMediate && item.status !== "inMediation" && (
            <Text color="#8A9AB5" fontSize="10px" lineHeight="15px">
              {t("Returns.detail.mediationHint")}
            </Text>
          )}
        </Stack>
      </Grid>
    </Stack>
  );
}

// Detalhe de uma devolução do buyer (Figma 2943-31506 e 2943-31619): prazo
// do seller, solicitação, comprovações, frete, acompanhamento e mediação.
export default function ReturnDetailPage() {
  const { returnId } = useParams<{ returnId: string }>();

  return (
    <AuthenticatedLayout>
      <ReturnDetailContent returnId={decodeURIComponent(returnId)} />
    </AuthenticatedLayout>
  );
}
