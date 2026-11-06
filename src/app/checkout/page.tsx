"use client";

import {
  Button,
  Checkbox,
  Flex,
  Grid,
  Icon,
  Link,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuArrowLeft, LuArrowRight, LuShieldCheck } from "react-icons/lu";

import CheckoutAddressForm from "@/components/CheckoutAddressForm";
import CheckoutCardPayment from "@/components/CheckoutCardPayment";
import CheckoutMethodStep from "@/components/CheckoutMethodStep";
import CheckoutOrderCard from "@/components/CheckoutOrderCard";
import CheckoutResult from "@/components/CheckoutResult";
import CheckoutStepper from "@/components/CheckoutStepper";
import CheckoutVerificationStep from "@/components/CheckoutVerificationStep";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import {
  ProfileSessionProvider,
  useProfileSession,
} from "@/contexts/ProfileSessionContext";
import { buildCartView } from "@/functions/cartView";
import { normalizePostalCode } from "@/functions/checkoutBody";
import { checkoutBlockReason } from "@/functions/checkoutBlock";
import { currencyLocale } from "@/functions/currencyLocale";
import { useCart } from "@/hooks/useCart";
import { useCartOfferings } from "@/hooks/useCartOfferings";
import { useCheckoutFlow } from "@/hooks/useCheckoutFlow";
import { useOrganizationAddress } from "@/hooks/useOrganizationAddress";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import type { WalletCurrency } from "@/services/wallet.service";

const WALLET_CURRENCIES: string[] = ["BRL", "USD", "EUR"];
const STEP_KEYS = ["summary", "method", "verification", "payment", "done"];

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Flex
      justify="space-between"
      gap="12px"
      py="8px"
      borderBottomWidth={strong ? 0 : "1px"}
      borderColor="#F0F2F7"
    >
      <Text
        as="dt"
        color={strong ? "#0F1729" : "#6F7B90"}
        fontSize="13px"
        fontWeight={strong ? 700 : 400}
      >
        {label}
      </Text>
      <Text
        as="dd"
        color={strong ? "#1F5AFF" : "#0F1729"}
        fontSize={strong ? "16px" : "13px"}
        fontWeight={700}
      >
        {value}
      </Text>
    </Flex>
  );
}

function CheckoutContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const router = useRouter();
  const { organizationId, context } = useProfileSession();
  const cart = useCart(organizationId ?? "");
  const { offerings } = useCartOfferings(
    cart.entries.map((entry) => entry.offeringId),
  );
  const view = buildCartView(cart.entries, offerings);
  const currencies = [...view.subtotals.keys()];
  const currency = currencies.length === 1 ? currencies[0] : null;
  const lines = view.groups.flatMap((group) => group.lines);

  const walletCurrency =
    currency && WALLET_CURRENCIES.includes(currency)
      ? (currency as WalletCurrency)
      : "BRL";
  const wallet = useWalletBalance(walletCurrency);
  const available =
    currency && wallet.balance?.currency === currency
      ? wallet.balance.availableMinor
      : null;

  const { address: legalAddress } = useOrganizationAddress(organizationId);
  const defaultAddress = React.useMemo(
    () =>
      legalAddress
        ? {
            street: legalAddress.street ?? "",
            complement: legalAddress.complement ?? "",
            city: legalAddress.city ?? "",
            state: legalAddress.state ?? "",
            postalCode: legalAddress.postal_code ?? "",
          }
        : null,
    [legalAddress],
  );

  const { clear } = cart;
  const flow = useCheckoutFlow({
    organizationId,
    lines,
    currency,
    availableCreditMinor: available,
    defaultAddress,
    onCompleted: clear,
  });

  const formatMinor = (minor: number, code = currency ?? "BRL") =>
    new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(
      minor / 100,
    );

  const blockReason = context ? checkoutBlockReason(context) : null;
  const checkoutTotal = flow.checkout?.totalMinor ?? flow.estimatedTotalMinor;
  const cardTotal = flow.checkout
    ? flow.checkout.orders.reduce((sum, order) => sum + order.cardMinor, 0)
    : flow.cardMinor;
  const errorText = flow.errorKey
    ? [t(flow.errorKey), flow.errorMessage].filter(Boolean).join(" ")
    : undefined;

  // Antes de gravar, o checkout vive do carrinho: vazio ou com pendência,
  // volta para ele.
  const started = flow.step > 3 || !!flow.checkout;
  let blocker: React.ReactNode = null;
  if (!started) {
    if (blockReason) blocker = t("Checkout.blocked.kyc");
    else if (cart.entries.length === 0) blocker = t("Checkout.blocked.empty");
    else if (!view.isLoading && (view.hasProblems || !currency)) {
      blocker = t("Checkout.blocked.fixCart");
    } else if (flow.summaryProblem === "serviceNeedsViability") {
      blocker = t("Checkout.blocked.service");
    }
  }

  let body: React.ReactNode;
  if (blocker) {
    body = (
      <Stack
        gap="14px"
        p="20px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="16px"
        role="alert"
      >
        <Text color="#92400E" fontSize="14px">
          {blocker}
        </Text>
        <Link asChild color="#1F5AFF" fontWeight={700} fontSize="13px">
          <NextLink href="/cart">
            <Icon as={LuArrowLeft} boxSize="14px" />
            {t("Checkout.actions.backToCart")}
          </NextLink>
        </Link>
      </Stack>
    );
  } else if (view.isLoading && !started) {
    body = <Skeleton h="320px" rounded="16px" aria-busy="true" />;
  } else if (flow.step === 1) {
    const awaitingPostalCode = !normalizePostalCode(flow.address.postalCode);
    body = (
      <Stack gap="16px">
        {view.hasPhysical && (
          <CheckoutAddressForm
            address={flow.address}
            onChange={flow.setAddressField}
            invalid={flow.showAddressErrors ? flow.addressErrors : []}
          />
        )}

        {view.groups.map((group, index) => (
          <CheckoutOrderCard
            key={group.sellerOrganizationId}
            index={index + 1}
            total={view.groups.length}
            sellerLabel={t("Cart.group.seller", {
              id: group.sellerOrganizationId.slice(0, 8).toUpperCase(),
            })}
            lines={group.lines}
            quotes={flow.quotes}
            shipping={flow.shipping}
            awaitingPostalCode={awaitingPostalCode}
            onSelectShipping={flow.selectShipping}
            formatMinor={(minor) => formatMinor(minor)}
          />
        ))}

        <Stack
          as="dl"
          gap="0"
          p="20px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="16px"
        >
          <Text
            as="h2"
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
            mb="6px"
          >
            {t("Checkout.summary.breakdown")}
          </Text>
          <Row
            label={t("Checkout.summary.products")}
            value={formatMinor(flow.productsMinor)}
          />
          {view.hasPhysical && (
            <Row
              label={t("Checkout.summary.shipping")}
              value={formatMinor(flow.shippingTotalMinor)}
            />
          )}
          <Row
            label={t("Checkout.summary.fee")}
            value={t("Checkout.summary.feeLater")}
          />
          <Row
            label={t("Checkout.summary.total")}
            value={formatMinor(flow.estimatedTotalMinor)}
            strong
          />
        </Stack>

        <Flex
          gap="10px"
          p="14px"
          bg="#F3F6FF"
          borderWidth="1px"
          borderColor="#D6E0FF"
          rounded="12px"
        >
          <Icon
            as={LuShieldCheck}
            boxSize="16px"
            color="#1F5AFF"
            mt="2px"
            flexShrink={0}
          />
          <Stack gap="2px">
            <Text color="#1F5AFF" fontSize="13px" fontWeight={700}>
              {t("Checkout.summary.escrowTitle")}
            </Text>
            <Text color="#5A6478" fontSize="12px">
              {t("Checkout.summary.escrowDescription")}
            </Text>
          </Stack>
        </Flex>

        <Checkbox.Root
          checked={flow.acceptedTerms}
          onCheckedChange={(details) =>
            flow.setAcceptedTerms(!!details.checked)
          }
          alignItems="flex-start"
          gap="10px"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control mt="2px" />
          <Checkbox.Label color="#5A6478" fontSize="12px" fontWeight={400}>
            {t("Checkout.summary.terms")}
          </Checkbox.Label>
        </Checkbox.Root>

        {flow.showAddressErrors && flow.summaryProblem && (
          <Text color="#DC2626" fontSize="12px" role="alert">
            {t(`Checkout.problems.${flow.summaryProblem}`)}
          </Text>
        )}

        <Grid templateColumns="1fr 1fr" gap="12px">
          <Button
            variant="outline"
            h="44px"
            rounded="12px"
            onClick={() => router.push("/cart")}
          >
            {t("Checkout.actions.cancel")}
          </Button>
          <Button
            h="44px"
            rounded="12px"
            bg="#1F5AFF"
            color="white"
            _hover={{ bg: "#1646CC" }}
            onClick={flow.continueFromSummary}
          >
            {t("Checkout.actions.toPayment")}
            <Icon as={LuArrowRight} boxSize="14px" />
          </Button>
        </Grid>
      </Stack>
    );
  } else if (flow.step === 2) {
    body = (
      <Stack gap="16px">
        <CheckoutMethodStep
          availableCreditMinor={available}
          useCredit={flow.useCredit}
          onUseCreditChange={flow.setUseCredit}
          creditMinor={flow.creditMinor}
          cardMinor={flow.cardMinor}
          totalMinor={flow.estimatedTotalMinor}
          formatMinor={(minor) => formatMinor(minor)}
        />
        <Grid templateColumns="1fr 1fr" gap="12px">
          <Button
            variant="outline"
            h="44px"
            rounded="12px"
            onClick={() => flow.goTo(1)}
          >
            <Icon as={LuArrowLeft} boxSize="14px" />
            {t("Checkout.actions.back")}
          </Button>
          <Button
            h="44px"
            rounded="12px"
            bg="#1F5AFF"
            color="white"
            _hover={{ bg: "#1646CC" }}
            onClick={flow.continueFromMethod}
          >
            {t("Checkout.actions.toVerification")}
            <Icon as={LuArrowRight} boxSize="14px" />
          </Button>
        </Grid>
      </Stack>
    );
  } else if (flow.step === 3) {
    body = (
      <CheckoutVerificationStep
        isPending={flow.isVerifying}
        error={errorText}
        needsEnrollment={flow.errorKey === "Checkout.errors.mfaEnrollment"}
        onSubmit={(code) => void flow.verify(code)}
        onCancel={() => flow.goTo(2)}
      />
    );
  } else if (flow.step === 4 && flow.clientSecret) {
    body = (
      <CheckoutCardPayment
        clientSecret={flow.clientSecret}
        amountLabel={formatMinor(cardTotal, flow.checkout?.currency)}
        onConfirmed={flow.onCardConfirmed}
        onFailed={flow.onCardFailed}
        error={errorText}
      />
    );
  } else {
    body = (
      <CheckoutResult
        outcome={flow.outcome}
        orderNumbers={(flow.checkout?.orders ?? []).map((order) =>
          order.id.slice(0, 8).toUpperCase(),
        )}
        totalLabel={formatMinor(checkoutTotal, flow.checkout?.currency)}
        onRetry={flow.restart}
      />
    );
  }

  return (
    <Stack
      maxW="760px"
      mx="auto"
      w="full"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="20px"
    >
      <Text as="h1" color="#0F1729" fontSize="24px" fontWeight={800}>
        {t("Checkout.title")}
      </Text>
      <CheckoutStepper
        current={flow.step}
        labels={STEP_KEYS.map((key) => t(`Checkout.steps.${key}`))}
        onSelect={(step) => flow.goTo(step as 1 | 2 | 3)}
      />
      {body}
    </Stack>
  );
}

// Checkout do Buyer (Figma "Checkout e pagamento", fluxo de pedido único e
// de vários pedidos): resumo com endereço e frete, método, verificação do
// autenticador, cartão no Stripe e resultado. Lê o mesmo carrinho de /cart.
export default function CheckoutPage() {
  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <CheckoutContent />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
