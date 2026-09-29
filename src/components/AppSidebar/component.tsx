"use client";

import {
  Box,
  Flex,
  Icon,
  Image,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuChevronRight, LuLogOut } from "react-icons/lu";

import { authService } from "@/services/auth.service";

import {
  AppSidebarProps,
  SidebarNavItem,
  SidebarNavSection,
  SidebarPersona,
} from "./interface";
import { PERSONA_COLORS, SIDEBAR_NAVIGATION } from "./navigation";

const AVATAR_GRADIENT = "linear-gradient(135deg, #1F5AFF 0%, #6B9FFF 100%)";

// Iniciais do avatar: primeira letra do primeiro e do último nome.
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

// Um item está ativo na própria rota e em qualquer sub-rota dela.
function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Linha fina que completa o título até a borda — padrão dos cabeçalhos. */
function HeadingRule({ color }: { color: string }) {
  return <Box flex="1" minW="1px" h="1px" bg={color} />;
}

function PersonaHeading({
  persona,
  isFirst,
}: {
  persona: SidebarPersona;
  isFirst: boolean;
}) {
  const { t } = useTranslation();
  const colors = PERSONA_COLORS[persona];

  return (
    <Flex
      align="center"
      gap="8px"
      px="8px"
      pt={isFirst ? "4px" : "16px"}
      pb={isFirst ? "6px" : "10px"}
    >
      <Box boxSize="8px" rounded="full" bg={colors.accent} flexShrink={0} />
      <Text
        color={colors.accent}
        fontSize="8.5px"
        fontWeight={800}
        lineHeight="12.75px"
        letterSpacing="0.85px"
        textTransform="uppercase"
        whiteSpace="nowrap"
      >
        {t(`AppSidebar.personas.${persona}`)}
      </Text>
      <HeadingRule color={colors.subtle} />
    </Flex>
  );
}

function NavItem({
  item,
  persona,
  isActive,
  count,
  onNavigate,
}: {
  item: SidebarNavItem;
  persona: SidebarPersona;
  isActive: boolean;
  count?: number;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const colors = PERSONA_COLORS[persona];
  const badgeBg = item.badgeTone === "danger" ? "#EF4444" : colors.accent;

  return (
    <Flex
      asChild
      align="center"
      gap="8px"
      w="full"
      px="10px"
      py="6px"
      rounded="10px"
      bg={isActive ? colors.subtle : "transparent"}
      color={isActive ? colors.accent : "#4A5568"}
      transition="background 0.15s"
      _hover={{ bg: isActive ? colors.subtle : "#F4F6F9" }}
      _focusVisible={{ outline: "2px solid", outlineColor: colors.accent }}
    >
      <NextLink
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
      >
        <Flex boxSize="14px" align="center" justify="center" flexShrink={0}>
          <Icon
            as={item.icon}
            boxSize={item.iconSize ?? "14px"}
            color={isActive ? colors.accent : "#9AAABF"}
          />
        </Flex>
        <Text
          flex="1"
          minW={0}
          truncate
          fontSize="12.5px"
          fontWeight={isActive ? 600 : 400}
          lineHeight="18.75px"
        >
          {t(`AppSidebar.items.${item.key}`)}
        </Text>
        {count ? (
          <Text
            as="span"
            px="6px"
            rounded="full"
            bg={badgeBg}
            color="white"
            fontSize="9.5px"
            fontWeight={700}
            lineHeight="16px"
            flexShrink={0}
          >
            {count}
          </Text>
        ) : null}
      </NextLink>
    </Flex>
  );
}

function NavSection({
  section,
  persona,
  pathname,
  badges,
  onNavigate,
}: {
  section: SidebarNavSection;
  persona: SidebarPersona;
  pathname: string;
  badges?: AppSidebarProps["badges"];
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const colors = PERSONA_COLORS[persona];

  return (
    <Stack as="section" gap="2px" pb="6px">
      <Flex align="center" gap="6px" px="8px" py="6px">
        <Text
          as="h3"
          color={colors.accent}
          fontSize="9.5px"
          fontWeight={700}
          lineHeight="14.25px"
          letterSpacing="0.6px"
          textTransform="uppercase"
          whiteSpace="nowrap"
        >
          {t(`AppSidebar.sections.${section.key}`)}
        </Text>
        <HeadingRule color={colors.subtle} />
      </Flex>

      {section.items.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          persona={persona}
          isActive={isActiveRoute(pathname, item.href)}
          count={badges?.[item.key]}
          onNavigate={onNavigate}
        />
      ))}
    </Stack>
  );
}

function UserMenu({ user }: Pick<AppSidebarProps, "user">) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    // Mesmo que a API falhe, o usuário sai — o cookie expira de qualquer forma.
    await authService.logout().catch(() => undefined);
    router.push("/login");
  };

  return (
    <Menu.Root positioning={{ placement: "right-end" }}>
      <Menu.Trigger asChild>
        <Flex
          as="button"
          align="center"
          gap="8px"
          w="full"
          px="8px"
          py="6px"
          rounded="10px"
          textAlign="start"
          cursor="pointer"
          aria-label={t("AppSidebar.user.menu")}
          _hover={{ bg: "#F4F6F9" }}
        >
          <Flex
            boxSize="28px"
            rounded="full"
            bgImage={AVATAR_GRADIENT}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Text
              color="white"
              fontSize="10px"
              fontWeight={700}
              lineHeight="15px"
            >
              {getInitials(user.name)}
            </Text>
          </Flex>

          <Stack flex="1" minW={0} gap={0}>
            <Text
              truncate
              color="#0F1729"
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
            >
              {user.name}
            </Text>
            <Flex align="center" gap="6px">
              <Box boxSize="6px" rounded="full" bg="#10B981" flexShrink={0} />
              <Flex align="center" gap="4px" fontSize="9px" lineHeight="13.5px">
                {user.personas.map((persona, index) => (
                  <Flex key={persona} align="center" gap="4px">
                    {index > 0 && (
                      <Text as="span" color="#A0ABB8" fontWeight={500}>
                        ·
                      </Text>
                    )}
                    <Text
                      as="span"
                      color={PERSONA_COLORS[persona].accent}
                      fontWeight={700}
                      title={t(`AppSidebar.personas.${persona}`)}
                    >
                      {t(`AppSidebar.personaInitials.${persona}`)}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Stack>

          <Icon
            as={LuChevronRight}
            boxSize="12px"
            color="#A0ABB8"
            flexShrink={0}
          />
        </Flex>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="160px">
            <Menu.Item value="logout" fontSize="12px" onSelect={handleLogout}>
              <Icon as={LuLogOut} boxSize="14px" />
              {t("AppSidebar.user.logout")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

/**
 * Navegação lateral da área autenticada.
 * Exibe os grupos Buyer e/ou Seller conforme os papéis da organização do
 * usuário, destaca a rota atual e mostra os contadores recebidos por props.
 */
export function AppSidebar({ user, badges, onNavigate }: AppSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";

  const groups = SIDEBAR_NAVIGATION.filter((group) =>
    user.personas.includes(group.persona),
  );

  return (
    <Flex
      as="aside"
      direction="column"
      w="232px"
      h="full"
      bg="white"
      borderRightWidth="1px"
      borderColor="#E5E8EE"
    >
      {/* Marca */}
      <Flex
        align="center"
        gap="10px"
        px="16px"
        pt="16px"
        pb="17px"
        borderBottomWidth="1px"
        borderColor="#E5E8EE"
        flexShrink={0}
      >
        <Flex w="140px" h="30px" align="center">
          <NextLink href="/dashboard" onClick={onNavigate}>
            <Image
              src="/assets/logo-wordmark-dark.svg"
              alt={t("AppSidebar.logoAlt")}
              w="124.139px"
              h="28.888px"
              objectFit="contain"
            />
          </NextLink>
        </Flex>
        <Flex flex="1" justify="flex-end">
          <Icon as={LuChevronDown} boxSize="12px" color="#A0ABB8" aria-hidden />
        </Flex>
      </Flex>

      {/* Navegação */}
      <Box
        as="nav"
        aria-label={t("AppSidebar.navLabel")}
        flex="1"
        minH={0}
        overflowY="auto"
        px="8px"
        py="4px"
      >
        {groups.map((group, index) => (
          <Box key={group.persona}>
            <PersonaHeading persona={group.persona} isFirst={index === 0} />
            {group.sections.map((section) => (
              <NavSection
                key={section.key}
                section={section}
                persona={group.persona}
                pathname={pathname}
                badges={badges}
                onNavigate={onNavigate}
              />
            ))}
          </Box>
        ))}
      </Box>

      {/* Usuário */}
      <Box
        px="8px"
        pt="11px"
        pb="10px"
        borderTopWidth="1px"
        borderColor="#E5E8EE"
        flexShrink={0}
      >
        <UserMenu user={user} />
      </Box>
    </Flex>
  );
}
