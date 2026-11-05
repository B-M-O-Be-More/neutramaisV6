"use client";

import { Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import FormReturnRequest, {
  type ReturnRequestValues,
} from "@/components/Forms/FormReturnRequest";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ReturnsBackLink from "@/components/ReturnsBackLink";
import { toaster } from "@/components/ui/toaster";
import { useReturns } from "@/contexts/ReturnsContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { formatShortDate } from "@/functions/proposalFormat";

function NewReturnContent({ orderId }: { orderId: string | undefined }) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const router = useRouter();
  const { returnableOrders, pendingId, createReturn } = useReturns();
  const order = returnableOrders.find((item) => item.id === orderId);

  const handleSubmit = async (values: ReturnRequestValues) => {
    if (!order) return;
    const created = await createReturn(order.id, values);
    if (!created) {
      toaster.create({
        type: "error",
        title: t("Returns.toasts.actionFailed"),
      });
      return;
    }
    toaster.create({
      type: "success",
      title: t(`Returns.toasts.created.${values.type}`),
      description: t("Returns.toasts.createdDescription", { id: created.id }),
    });
    router.push(`/returns/${encodeURIComponent(created.id)}`);
  };

  return (
    <Stack
      w="full"
      maxW="768px"
      mx="auto"
      px={{ base: 4, md: 0 }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <ReturnsBackLink label={t("Returns.form.back")} />

      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("Returns.form.title")}
        </Text>
        {order && (
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("Returns.form.subtitle", {
              orderId: order.id,
              product: order.productName,
              date: formatShortDate(order.receivedAt, locale),
            })}
          </Text>
        )}
      </Stack>

      {order ? (
        <FormReturnRequest
          locale={locale}
          isSubmitting={pendingId === "new"}
          onSubmit={handleSubmit}
        />
      ) : (
        <Text color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("Returns.form.orderNotFound")}
        </Text>
      )}
    </Stack>
  );
}

// Solicitar devolução ou troca de um pedido entregue (Figma 2943-31732). O
// pedido vem em `?orderId=`; a tela de pedidos do buyer é quem abre este
// formulário.
export default function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = React.use(searchParams);

  return (
    <AuthenticatedLayout>
      <NewReturnContent orderId={orderId} />
    </AuthenticatedLayout>
  );
}
