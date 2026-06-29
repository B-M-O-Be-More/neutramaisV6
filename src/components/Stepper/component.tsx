"use client";

import { Steps } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

import { StepperProps } from "./interface";

export function Stepper({ steps, step, onStepClick }: StepperProps) {
  return (
    <Steps.Root step={step} count={steps.length} size="sm" w="full">
      <Steps.List>
        {steps.map((title, index) => {
          const isCompleted = index < step;
          const isCurrent = index === step;

          // Concluído -> círculo azul preenchido + check branco.
          // Atual -> borda/número #1F5AFF; ainda não visitado -> #364153.
          const accent = isCurrent
            ? "#1F5AFF"
            : index > step
              ? "#364153"
              : undefined;

          return (
            <Steps.Item key={title} index={index} title={title}>
              <Steps.Trigger
                onClick={() => onStepClick?.(index)}
                flexDirection="column"
                gap={2}
                textAlign="center"
              >
                <Steps.Indicator
                  boxSize="40px"
                  borderColor={isCompleted ? "#1F5AFF" : accent}
                  bg={isCompleted ? "#1F5AFF" : undefined}
                  color={isCompleted ? "#FFF" : accent}
                >
                  <Steps.Status
                    complete={<LuCheck />}
                    incomplete={<Steps.Number />}
                  />
                </Steps.Indicator>
                <Steps.Title fontSize="16px" fontWeight={400}>
                  {title}
                </Steps.Title>
              </Steps.Trigger>
              <Steps.Separator bg={isCompleted ? "#1F5AFF" : undefined} />
            </Steps.Item>
          );
        })}
      </Steps.List>
    </Steps.Root>
  );
}
