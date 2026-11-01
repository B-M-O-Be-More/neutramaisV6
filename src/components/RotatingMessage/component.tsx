"use client";

import { Text } from "@chakra-ui/react";
import React from "react";

import { RotatingMessageProps } from "./interface";

/**
 * Texto que troca sozinho a cada `intervalMs`, esmaecendo entre uma mensagem
 * e outra — em esperas longas, mostra que a tela não travou. Com "reduzir
 * movimento" no sistema, troca sem animação.
 */
export function RotatingMessage({
  messages,
  intervalMs = 3000,
  fadeMs = 300,
  loopFrom = 0,
  ...textProps
}: RotatingMessageProps) {
  const [index, setIndex] = React.useState(0);
  const [isVisible, setVisible] = React.useState(true);
  const count = messages.length;

  React.useEffect(() => {
    if (count < 2) return;
    let swap: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      // Esmaece, troca o texto e reaparece.
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((current) =>
          current + 1 < count ? current + 1 : Math.min(loopFrom, count - 1),
        );
        setVisible(true);
      }, fadeMs);
    }, intervalMs);
    return () => {
      clearInterval(timer);
      clearTimeout(swap);
    };
  }, [count, intervalMs, fadeMs, loopFrom]);

  return (
    <Text
      {...textProps}
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? "translateY(0)" : "translateY(4px)"}
      transition={`opacity ${fadeMs}ms ease, transform ${fadeMs}ms ease`}
      _motionReduce={{ transition: "none", transform: "none" }}
    >
      {messages[Math.min(index, count - 1)] ?? ""}
    </Text>
  );
}
