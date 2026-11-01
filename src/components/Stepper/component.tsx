"use client";

import { Steps } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

import { StepperProps } from "./interface";

export function Stepper({
  steps,
  step,
  onStepClick,
  variant = "default",
  accentColor = "#1F5AFF",
}: StepperProps) {
  const isCompact = variant === "compact";

  return (
    <Steps.Root step={step} count={steps.length} size="sm" w="full">
      <Steps.List>
        {steps.map((title, index) => {
          const isCompleted = index < step;
          const isCurrent = index === step;
          const isPending = index > step;
          // Padrão: concluída preenchida com check branco.
          // Compacto: atual preenchida com o número; concluída em contorno,
          // com o check na cor de destaque (Figma 2074-54253).
          const isFilled = isCompact ? isCurrent : isCompleted;
          const isOutlinedDone = isCompact && isCompleted;

          // Atual -> borda/número na cor de destaque; não visitado -> cinza.
          const accent =
            isCurrent || isOutlinedDone
              ? accentColor
              : isPending
                ? isCompact
                  ? "#C4CDD8"
                  : "#364153"
                : undefined;

          return (
            <Steps.Item key={title} index={index} title={title}>
              <Steps.Trigger
                onClick={() => onStepClick?.(index)}
                flexDirection="column"
                gap={isCompact ? 1 : 2}
                textAlign="center"
              >
                <Steps.Indicator
                  boxSize={isCompact ? "28px" : "40px"}
                  borderColor={
                    isFilled
                      ? accentColor
                      : isCompact && isPending
                        ? "#E5E8EE"
                        : accent
                  }
                  bg={
                    isFilled
                      ? accentColor
                      : isOutlinedDone
                        ? "white"
                        : undefined
                  }
                  color={isFilled ? "#FFF" : accent}
                  fontSize={isCompact ? "11px" : undefined}
                  fontWeight={isCompact ? 700 : undefined}
                >
                  <Steps.Status
                    complete={<LuCheck />}
                    incomplete={<Steps.Number />}
                  />
                </Steps.Indicator>
                <Steps.Title
                  fontSize={isCompact ? "10px" : "16px"}
                  lineHeight={isCompact ? "15px" : undefined}
                  fontWeight={isCompact && isCurrent ? 700 : 400}
                  color={
                    isCompact
                      ? isCurrent || isCompleted
                        ? accentColor
                        : "#5A6478"
                      : undefined
                  }
                >
                  {title}
                </Steps.Title>
              </Steps.Trigger>
              <Steps.Separator
                bg={
                  isCompleted || (isCompact && isCurrent)
                    ? accentColor
                    : isCompact
                      ? "#A6AFC2"
                      : undefined
                }
              />
            </Steps.Item>
          );
        })}
      </Steps.List>
    </Steps.Root>
  );
}
