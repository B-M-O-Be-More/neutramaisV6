"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuCreditCard, LuTriangleAlert } from "react-icons/lu";

import { getStripe } from "@/functions/stripeClient";

import { CheckoutCardPaymentProps } from "./interface";

// Visual do Figma (inputs cinza-claro, borda #E5E8EE, cantos de 12px).
const APPEARANCE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#1F5AFF",
    colorText: "#0F1729",
    colorTextSecondary: "#5A6478",
    colorDanger: "#DC2626",
    colorBackground: "#F8F9FB",
    borderRadius: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSizeBase: "14px",
  },
  rules: {
    ".Input": { border: "1px solid #E5E8EE", boxShadow: "none" },
    ".Label": { fontWeight: "600", fontSize: "13px" },
  },
};

function CardForm({
  amountLabel,
  onConfirmed,
  onFailed,
  error,
}: Omit<CheckoutCardPaymentProps, "clientSecret">) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isPending, setIsPending] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || isPending) return;
    setIsPending(true);
    const result = await stripe.confirmPayment({
      elements,
      // 3DS pode precisar sair da página: volta para os pedidos.
      confirmParams: { return_url: `${window.location.origin}/orders` },
      redirect: "if_required",
    });
    setIsPending(false);
    if (result.error) onFailed(result.error.message);
    else onConfirmed();
  };

  return (
    <Stack as="form" onSubmit={submit} gap="16px">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <Text color="#DC2626" fontSize="12px" role="alert">
          {error}
        </Text>
      )}
      <Button
        type="submit"
        h="46px"
        rounded="12px"
        bg="#1F5AFF"
        color="white"
        _hover={{ bg: "#1646CC" }}
        loading={isPending}
        disabled={!stripe || !elements}
      >
        {t("Checkout.card.submit", { amount: amountLabel })}
        <Icon as={LuArrowRight} boxSize="14px" />
      </Button>
    </Stack>
  );
}

/**
 * Passo 4 (Figma "Pagamento Cartão"): os campos do cartão são o Payment
 * Element do Stripe (o número do cartão nunca passa pela Neutra+, exigência
 * PCI). Confirma o PaymentIntent que a payment-api criou.
 */
export function CheckoutCardPayment({
  clientSecret,
  amountLabel,
  ...form
}: CheckoutCardPaymentProps) {
  const { t } = useTranslation();
  const stripe = getStripe();

  return (
    <Stack gap="16px">
      <Flex align="center" gap="12px">
        <Flex
          align="center"
          justify="center"
          boxSize="40px"
          rounded="10px"
          bg="#EEF3FF"
        >
          <Icon as={LuCreditCard} boxSize="18px" color="#1F5AFF" />
        </Flex>
        <Stack gap="0">
          <Text as="h2" color="#0F1729" fontSize="16px" fontWeight={800}>
            {t("Checkout.card.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="12px">
            {t("Checkout.card.total")}{" "}
            <Text as="span" color="#0F1729" fontWeight={700}>
              {amountLabel}
            </Text>
          </Text>
        </Stack>
      </Flex>

      {stripe ? (
        <Elements
          stripe={stripe}
          options={{ clientSecret, appearance: APPEARANCE, locale: "pt-BR" }}
        >
          <CardForm amountLabel={amountLabel} {...form} />
        </Elements>
      ) : (
        <Flex
          gap="8px"
          p="14px"
          bg="#FEF2F2"
          borderWidth="1px"
          borderColor="#FECACA"
          rounded="12px"
          role="alert"
        >
          <Icon as={LuTriangleAlert} boxSize="16px" color="#DC2626" mt="2px" />
          <Text color="#991B1B" fontSize="13px">
            {t("Checkout.card.notConfigured")}
          </Text>
        </Flex>
      )}
    </Stack>
  );
}
