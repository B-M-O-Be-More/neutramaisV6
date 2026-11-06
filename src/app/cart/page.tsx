"use client";

import {
  Button,
  Flex,
  Grid,
  Icon,
  IconButton,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuRefreshCw, LuSearch, LuTrash2 } from "react-icons/lu";

import CartAddressCard from "@/components/CartAddressCard";
import CartBlockedNotice from "@/components/CartBlockedNotice";
import CartCreditToggle from "@/components/CartCreditToggle";
import CartItemRow from "@/components/CartItemRow";
import CartSellerGroup from "@/components/CartSellerGroup";
import CartSummaryCard from "@/components/CartSummaryCard";
import CartTrustList from "@/components/CartTrustList";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import {
  ProfileSessionProvider,
  useProfileSession,
} from "@/contexts/ProfileSessionContext";
import { buildCartView, type CartLine } from "@/functions/cartView";
import { checkoutBlockReason } from "@/functions/checkoutBlock";
import { currencyLocale } from "@/functions/currencyLocale";
import { useCart } from "@/hooks/useCart";
import { useCartOfferings } from "@/hooks/useCartOfferings";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import type { WalletCurrency } from "@/services/wallet.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WALLET_CURRENCIES: string[] = ["BRL", "USD", "EUR"];

/** Soma as linhas que podem seguir, por moeda: "R$ 16.980,00 + US$ 10,00". */
function groupSubtotal(lines: CartLine[], locale: string) {
  const totals = new Map<string, number>();
  for (const line of lines) {
    if (line.problem || !line.price) continue;
    const currency = line.snapshot.currency ?? "BRL";
    totals.set(currency, (totals.get(currency) ?? 0) + line.price.totalMinor);
  }
  return [...totals]
    .map(([currency, minor]) =>
      new Intl.NumberFormat(locale, { style: "currency", currency }).format(
        minor / 100,
      ),
    )
    .join(" + ");
}

function CartContent({ addOfferingId }: { addOfferingId?: string }) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const router = useRouter();
  const { organizationId, context } = useProfileSession();
  const cart = useCart(organizationId ?? "");
  const { offerings, retry } = useCartOfferings(
    cart.entries.map((entry) => entry.offeringId),
  );
  const [useCredit, setUseCredit] = React.useState(true);

  // "Adicionar" no catálogo chega como /cart?offeringId=…: entra e sai da URL.
  const { add } = cart;
  React.useEffect(() => {
    if (!addOfferingId) return;
    if (UUID.test(addOfferingId)) add(addOfferingId);
    router.replace("/cart");
  }, [addOfferingId, add, router]);

  const view = buildCartView(cart.entries, offerings);
  const currencies = [...view.subtotals.keys()];
  const currency = currencies.length === 1 ? currencies[0] : null;
  const walletCurrency =
    currency && WALLET_CURRENCIES.includes(currency)
      ? (currency as WalletCurrency)
      : "BRL";
  const wallet = useWalletBalance(walletCurrency);
  const available =
    currency && wallet.balance?.currency === currency
      ? wallet.balance.availableMinor
      : null;
  const subtotal = currency ? (view.subtotals.get(currency) ?? 0) : 0;
  const creditMinor =
    useCredit && available ? Math.min(available, subtotal) : 0;

  const blockReason = context ? checkoutBlockReason(context) : null;
  const notice =
    currencies.length > 1
      ? t("Cart.summary.mixedCurrencies", { currencies: currencies.join(", ") })
      : view.hasProblems
        ? t("Cart.summary.fixItems")
        : undefined;
  const canCheckout =
    !blockReason &&
    !view.isLoading &&
    !view.hasProblems &&
    !!currency &&
    view.groups.length > 0;

  const itemCount = cart.entries.length;
  let lineIndex = 0;

  let items: React.ReactNode;
  if (itemCount === 0) {
    items = (
      <Stack
        align="center"
        gap="12px"
        px="24px"
        py="40px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
        textAlign="center"
      >
        <Text
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("Cart.empty.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Cart.empty.description")}
        </Text>
        <Button
          asChild
          h="38px"
          px="14px"
          gap="8px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          fontSize="13px"
          fontWeight={700}
          _hover={{ bg: "#1646CC" }}
        >
          <NextLink href="/search-network">
            <Icon as={LuSearch} boxSize="14px" />
            {t("Cart.empty.action")}
          </NextLink>
        </Button>
      </Stack>
    );
  } else {
    items = (
      <>
        {view.groups.map((group, groupIndex) => (
          <CartSellerGroup
            key={group.sellerOrganizationId}
            title={t("Cart.group.seller", {
              id: group.sellerOrganizationId.slice(0, 8).toUpperCase(),
            })}
            badge={t("Cart.group.order", { number: groupIndex + 1 })}
            countLabel={t("Cart.group.items", { count: group.lines.length })}
            subtotalLabel={t("Cart.group.subtotal", {
              value: groupSubtotal(group.lines, locale) || "—",
            })}
          >
            {group.lines.map((line) => (
              <CartItemRow
                key={line.entry.offeringId}
                line={line}
                index={lineIndex++}
                locale={locale}
                onQuantityChange={(quantity) =>
                  cart.setQuantity(line.entry.offeringId, quantity)
                }
                onRemove={() => cart.remove(line.entry.offeringId)}
              />
            ))}
          </CartSellerGroup>
        ))}

        {view.isLoading && (
          <Skeleton h="160px" rounded="16px" aria-busy="true" />
        )}

        {view.unavailable.length > 0 && (
          <CartSellerGroup title={t("Cart.unavailable.title")}>
            {view.unavailable.map(({ entry, status }) => (
              <Flex
                as="li"
                key={entry.offeringId}
                align="center"
                justify="space-between"
                gap="12px"
                px="20px"
                py="14px"
                borderBottomWidth="1px"
                borderColor="#F0F2F7"
              >
                <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                  {t(`Cart.unavailable.${status}`)}
                </Text>
                <Flex gap="4px" flexShrink={0}>
                  {status === "failed" && (
                    <IconButton
                      aria-label={t("Cart.unavailable.retry")}
                      variant="plain"
                      boxSize="32px"
                      minW="32px"
                      rounded="8px"
                      color="#1F5AFF"
                      onClick={retry}
                    >
                      <Icon as={LuRefreshCw} boxSize="14px" />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label={t("Cart.unavailable.remove")}
                    variant="plain"
                    boxSize="32px"
                    minW="32px"
                    rounded="8px"
                    color="#8A9AB5"
                    _hover={{ bg: "#FEF2F2", color: "#EF4444" }}
                    onClick={() => cart.remove(entry.offeringId)}
                  >
                    <Icon as={LuTrash2} boxSize="14px" />
                  </IconButton>
                </Flex>
              </Flex>
            ))}
          </CartSellerGroup>
        )}
      </>
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
          {t("Cart.title")}
        </Text>
        {itemCount > 0 && (
          <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
            {t("Cart.subtitle", {
              items: t("Cart.itemCount", { count: itemCount }),
              sellers: t("Cart.sellerCount", { count: view.groups.length }),
            })}
          </Text>
        )}
      </Stack>

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 340px" }}
        gap="20px"
        alignItems="start"
      >
        <Stack gap="16px" minW={0}>
          {blockReason && <CartBlockedNotice reason={blockReason} />}
          {items}
        </Stack>

        <Stack gap="16px" minW={0}>
          {/* O endereço de entrega é preenchido no 1º passo do checkout. */}
          <CartAddressCard onAddAddress={() => router.push("/checkout")} />
          <CartSummaryCard
            subtotals={view.subtotals}
            creditMinor={creditMinor}
            hasPhysical={view.hasPhysical}
            locale={locale}
            notice={notice}
            canCheckout={canCheckout}
            onCheckout={() => router.push("/checkout")}
          />
          <CartCreditToggle
            availableMinor={available}
            currency={currency ?? "BRL"}
            locale={locale}
            checked={useCredit}
            onCheckedChange={setUseCredit}
          />
          <CartTrustList />
        </Stack>
      </Grid>
    </Stack>
  );
}

// Carrinho do buyer (Figma 2879-94537; bloqueado por KYC, 3053-41467). A
// plataforma ainda não guarda o carrinho: ele fica neste navegador e cada
// oferta é lida no snapshot de checkout do marketplace, com o token do perfil
// Buyer. `?offeringId=` (botão "Adicionar" do catálogo) põe a oferta nele.
export default function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ offeringId?: string }>;
}) {
  const { offeringId } = React.use(searchParams);

  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <CartContent addOfferingId={offeringId} />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
