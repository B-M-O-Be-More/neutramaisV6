"use client";

import { Box, Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ServiceOrderChat from "@/components/ServiceOrderChat";
import ServiceOrderEvidences from "@/components/ServiceOrderEvidences";
import ServiceOrderInfoCard from "@/components/ServiceOrderInfoCard";
import ServiceOrderPostponeDialog from "@/components/ServiceOrderPostponeDialog";
import ServiceOrderProgress from "@/components/ServiceOrderProgress";
import ServiceOrdersBreadcrumb from "@/components/ServiceOrdersBreadcrumb";
import ServiceOrderSidePanel from "@/components/ServiceOrderSidePanel";
import ServiceOrderStartPrompt from "@/components/ServiceOrderStartPrompt";
import ServiceOrderTechnicianDialog from "@/components/ServiceOrderTechnicianDialog";
import ServiceOrderTechnicians from "@/components/ServiceOrderTechnicians";
import { toaster } from "@/components/ui/toaster";
import { useSellerServiceOrders } from "@/contexts/SellerServiceOrdersContext";
import { SERVICE_ORDER_ITEM_STYLES } from "@/data/serviceOrderStatus";
import { currencyLocale } from "@/functions/currencyLocale";
import type {
  ServiceOrderPostponement,
  ServiceOrderTechnicianDraft,
} from "@/types/serviceOrders";

const LIST_ROOT = "/seller/service-orders";

/** Maior arquivo aceito como evidência (25 MB). */
const EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;

type TechnicianChoice = string | ServiceOrderTechnicianDraft;

function ServiceOrderDetailContent({
  orderId,
  itemId,
}: {
  orderId: string;
  itemId: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const {
    technicians,
    now,
    pendingId,
    findItem,
    assignTechnician,
    startItem,
    completeItem,
    postpone,
    registerEvidence,
    sendMessage,
  } = useSellerServiceOrders();
  const found = findItem(orderId, itemId);
  const [isChoosingTechnician, setChoosingTechnician] = React.useState(false);
  // Técnico escolhido numa OS pendente, à espera de "iniciar agora?".
  const [choice, setChoice] = React.useState<TechnicianChoice | null>(null);
  const [isPostponing, setPostponing] = React.useState(false);
  const [registeringIndex, setRegisteringIndex] = React.useState<number | null>(
    null,
  );

  const ordersHref = `${LIST_ROOT}/${encodeURIComponent(orderId)}`;
  const breadcrumb = [
    { label: t("ServiceOrders.title"), href: LIST_ROOT },
    { label: orderId, href: ordersHref },
    { label: itemId },
  ];

  if (!found) {
    return (
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "28px" }}
        gap="16px"
      >
        <ServiceOrdersBreadcrumb items={breadcrumb} />
        <Text color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("ServiceOrders.notFound")}
        </Text>
      </Stack>
    );
  }

  const { order, item } = found;
  const style = SERVICE_ORDER_ITEM_STYLES[item.status];
  const isBusy = pendingId === item.id;
  const isOpen = item.status !== "completed" && item.status !== "cancelled";

  const notify = (ok: boolean, success: string) =>
    toaster.create(
      ok
        ? { type: "success", title: t(success) }
        : { type: "error", title: t("ServiceOrders.toasts.actionFailed") },
    );

  const applyTechnician = async (
    technician: TechnicianChoice,
    start: boolean,
  ) => {
    const updated = await assignTechnician(item.id, technician, start);
    notify(
      !!updated,
      start
        ? "ServiceOrders.toasts.started"
        : "ServiceOrders.toasts.technicianAssigned",
    );
    return !!updated;
  };

  const handleTechnician = async (technician: TechnicianChoice) => {
    setChoosingTechnician(false);
    // Pendente: pergunta se a execução já começa (Figma 2968-72899).
    if (item.status === "pending") {
      setChoice(technician);
      return;
    }
    await applyTechnician(technician, false);
  };

  const handlePostpone = async (
    id: string,
    postponement: ServiceOrderPostponement,
  ) => {
    const updated = await postpone(id, postponement);
    notify(!!updated, "ServiceOrders.toasts.postponed");
    return !!updated;
  };

  const handleEvidence = async (index: number, file: File) => {
    if (file.size > EVIDENCE_MAX_BYTES) {
      toaster.create({
        type: "error",
        title: t("ServiceOrders.toasts.evidenceTooLarge"),
      });
      return;
    }
    setRegisteringIndex(index);
    try {
      const updated = await registerEvidence(item.id, index, file);
      notify(!!updated, "ServiceOrders.toasts.evidenceRegistered");
    } finally {
      setRegisteringIndex(null);
    }
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <ServiceOrdersBreadcrumb items={breadcrumb} />

      <Flex
        align="flex-start"
        justify="space-between"
        gap="12px"
        direction={{ base: "column", md: "row" }}
      >
        <Stack gap="4px" minW={0}>
          <Text
            as="h1"
            color="#0F1729"
            fontSize="22px"
            fontWeight={800}
            lineHeight="28px"
          >
            {item.productName}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("ServiceOrders.detail.subtitle", {
              seller: order.sellerName,
              buyer: order.buyerName,
              id: item.id,
              orderId: order.orderId,
            })}
          </Text>
        </Stack>
        <Flex
          align="center"
          gap="8px"
          flexShrink={0}
          px="13px"
          py="6px"
          bg={style.bg}
          borderWidth="1px"
          borderColor={style.border}
          rounded="13px"
          color={style.color}
        >
          <Box boxSize="8px" rounded="full" bg={style.color} aria-hidden />
          <Text fontSize="13px" fontWeight={600} lineHeight="19.5px">
            {t(`ServiceOrders.item.status.${item.status}`)}
          </Text>
        </Flex>
      </Flex>

      <ServiceOrderProgress item={item} locale={locale} now={now} />

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 392px" }}
        gap="20px"
        alignItems="flex-start"
      >
        <Stack gap="20px" minW={0}>
          <ServiceOrderInfoCard item={item} locale={locale} />
          <ServiceOrderTechnicians
            technician={item.technician}
            canChange={isOpen}
            onChange={() => setChoosingTechnician(true)}
          />
          <ServiceOrderEvidences
            item={item}
            canRegister={item.status === "inProgress"}
            registeringIndex={registeringIndex}
            onRegister={handleEvidence}
          />
          <ServiceOrderChat
            messages={item.messages}
            locale={i18n.language}
            disabled={!isOpen}
            onSend={async (text) => {
              const ok = await sendMessage(item.id, text);
              if (!ok) {
                toaster.create({
                  type: "error",
                  title: t("ServiceOrders.toasts.actionFailed"),
                });
              }
              return ok;
            }}
          />
        </Stack>

        <ServiceOrderSidePanel
          item={item}
          order={order}
          backHref={ordersHref}
          isBusy={isBusy}
          onStart={async () => {
            notify(
              !!(await startItem(item.id)),
              "ServiceOrders.toasts.started",
            );
          }}
          onAddTechnician={() => setChoosingTechnician(true)}
          onPostpone={() => setPostponing(true)}
          onComplete={async () => {
            notify(
              !!(await completeItem(item.id)),
              "ServiceOrders.toasts.completed",
            );
          }}
        />
      </Grid>

      <ServiceOrderTechnicianDialog
        key={isChoosingTechnician ? "open" : "closed"}
        item={isChoosingTechnician ? item : null}
        technicians={technicians}
        isPending={isBusy}
        onClose={() => setChoosingTechnician(false)}
        onConfirm={handleTechnician}
      />

      <ServiceOrderStartPrompt
        open={choice !== null}
        isPending={isBusy}
        onClose={() => setChoice(null)}
        onChoose={async (start) => {
          if (choice === null) return;
          await applyTechnician(choice, start);
          setChoice(null);
        }}
      />

      <ServiceOrderPostponeDialog
        key={isPostponing ? "open" : "closed"}
        item={isPostponing ? item : null}
        isPending={isBusy}
        onClose={() => setPostponing(false)}
        onConfirm={handlePostpone}
      />
    </Stack>
  );
}

// Detalhe de uma OS do seller (Figma 2191-21596; com dados: 2968-70307):
// progresso TMF641, informações, técnico, evidências, comunicação e, na
// coluna, o status atual, o mapa e as ações.
export default function ServiceOrderDetailPage() {
  const { orderId, itemId } = useParams<{ orderId: string; itemId: string }>();

  return (
    <AuthenticatedLayout>
      <ServiceOrderDetailContent
        orderId={decodeURIComponent(orderId)}
        itemId={decodeURIComponent(itemId)}
      />
    </AuthenticatedLayout>
  );
}
