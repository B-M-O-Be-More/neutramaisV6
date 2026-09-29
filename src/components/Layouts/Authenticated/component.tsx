"use client";

import {
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  IconButton,
  Image,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMenu } from "react-icons/lu";

import AppSidebar from "@/components/AppSidebar";
import { SessionProvider, useSession } from "@/contexts/SessionContext";

import { AuthenticatedLayoutProps } from "./interface";

/** Tela inteira enquanto a sessão carrega ou quando o /me falhou. */
function SessionGate() {
  const { t } = useTranslation();
  const { status, reload } = useSession();

  return (
    <Stack
      w="full"
      minH="100dvh"
      align="center"
      justify="center"
      gap="12px"
      bg="bg.page"
      px={6}
      textAlign="center"
    >
      {status === "error" ? (
        <>
          <Text color="#0F1729" fontSize="14px" fontWeight={600}>
            {t("AuthenticatedLayout.error")}
          </Text>
          <Button
            variant="plain"
            h="36px"
            px="14px"
            rounded="10px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={600}
            onClick={reload}
          >
            {t("AuthenticatedLayout.retry")}
          </Button>
        </>
      ) : (
        <Spinner
          color="#1F5AFF"
          size="lg"
          aria-label={t("AuthenticatedLayout.loading")}
        />
      )}
    </Stack>
  );
}

function AuthenticatedShell({ children, badges }: AuthenticatedLayoutProps) {
  const { t } = useTranslation();
  const { status, profile, personas } = useSession();
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);

  // Nada da área autenticada aparece antes de o /me confirmar a sessão.
  if (status !== "authenticated" || !profile) return <SessionGate />;

  const user = { name: profile.display_name, personas };

  return (
    <Flex w="full" minH="100dvh" bg="bg.page">
      <Box
        display={{ base: "none", lg: "block" }}
        position="sticky"
        top={0}
        h="100dvh"
        flexShrink={0}
      >
        <AppSidebar user={user} badges={badges} />
      </Box>

      <Flex direction="column" flex="1" minW={0}>
        <Flex
          display={{ base: "flex", lg: "none" }}
          align="center"
          gap="12px"
          h="56px"
          px={4}
          bg="white"
          borderBottomWidth="1px"
          borderColor="#E5E8EE"
        >
          <IconButton
            variant="ghost"
            size="sm"
            color="#4A5568"
            aria-label={t("AppSidebar.openMenu")}
            onClick={() => setDrawerOpen(true)}
          >
            <LuMenu />
          </IconButton>
          <Image
            src="/assets/logo-wordmark-dark.svg"
            alt={t("AppSidebar.logoAlt")}
            h="24px"
            objectFit="contain"
          />
        </Flex>

        <Box as="main" flex="1" minW={0}>
          {children}
        </Box>
      </Flex>

      <Drawer.Root
        open={isDrawerOpen}
        onOpenChange={(details) => setDrawerOpen(details.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content w="232px" maxW="232px">
              <AppSidebar
                user={user}
                badges={badges}
                onNavigate={() => setDrawerOpen(false)}
              />
              <Drawer.CloseTrigger asChild top="12px" insetEnd="-44px">
                <CloseButton size="sm" bg="white" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Flex>
  );
}

/**
 * Casca da área autenticada: valida a sessão pelo `GET /me` e só então
 * renderiza a navegação lateral (fixa no desktop; em drawer abaixo de `lg`) e
 * o conteúdo. Os filhos podem usar `useSession()` para ler o usuário.
 */
function AuthenticatedLayout({ children, badges }: AuthenticatedLayoutProps) {
  return (
    <SessionProvider>
      <AuthenticatedShell badges={badges}>{children}</AuthenticatedShell>
    </SessionProvider>
  );
}

export { AuthenticatedLayout };
