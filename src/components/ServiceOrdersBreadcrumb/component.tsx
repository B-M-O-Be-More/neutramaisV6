"use client";

import { Flex, Icon, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import { ServiceOrdersBreadcrumbProps } from "./interface";

/**
 * Trilha das ordens de serviço (Figma 2968-70314): "‹ Ordens de Serviço /
 * … / atual". O primeiro nível leva a seta de voltar; o último é a página.
 */
export function ServiceOrdersBreadcrumb({
  items,
}: ServiceOrdersBreadcrumbProps) {
  const { t } = useTranslation();

  return (
    <Flex
      as="nav"
      aria-label={t("ServiceOrders.breadcrumb")}
      align="center"
      gap="10px"
      wrap="wrap"
      fontSize="14px"
      lineHeight="21px"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${index}-${item.label}`}>
            {index > 0 && (
              <Text as="span" color="#C4CDD8" aria-hidden>
                /
              </Text>
            )}
            {isLast || !item.href ? (
              <Text
                as="span"
                color="#0F1729"
                fontWeight={600}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </Text>
            ) : (
              <Link
                asChild
                display="flex"
                alignItems="center"
                gap="6px"
                color="#8A9AB5"
                _hover={{ color: "#5A6478", textDecoration: "none" }}
              >
                <NextLink href={item.href}>
                  {index === 0 && (
                    <Icon as={LuChevronLeft} boxSize="15px" aria-hidden />
                  )}
                  {item.label}
                </NextLink>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </Flex>
  );
}
