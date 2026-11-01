"use client";

import { Button, Icon } from "@chakra-ui/react";
import NextLink from "next/link";
import { LuArrowLeft } from "react-icons/lu";

import { ReturnsBackLinkProps } from "./interface";

/** Volta para a lista de devoluções (Figma 2943-31507). */
export function ReturnsBackLink({ label }: ReturnsBackLinkProps) {
  return (
    <Button
      variant="plain"
      alignSelf="flex-start"
      h="auto"
      p={0}
      gap="8px"
      color="#8A9AB5"
      fontSize="13px"
      fontWeight={400}
      lineHeight="19.5px"
      _hover={{ color: "#5A6478" }}
      asChild
    >
      <NextLink href="/returns">
        <Icon as={LuArrowLeft} boxSize="15px" />
        {label}
      </NextLink>
    </Button>
  );
}
