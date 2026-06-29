import { describe, expect, it, vi } from "vitest";

import Stepper from "@/components/Stepper";

import { renderWithProviders, screen } from "../test-utils";

const STEPS = ["Dados", "Endereço", "Responsável"];

describe("Stepper", () => {
  it("renderiza todos os títulos das etapas", () => {
    renderWithProviders(<Stepper steps={STEPS} step={0} />);

    STEPS.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("dispara onStepClick com o índice da etapa clicada", async () => {
    const onStepClick = vi.fn();
    const { user } = renderWithProviders(
      <Stepper steps={STEPS} step={2} onStepClick={onStepClick} />,
    );

    await user.click(screen.getByText("Dados"));

    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("não quebra quando onStepClick não é informado", async () => {
    const { user } = renderWithProviders(<Stepper steps={STEPS} step={1} />);

    await expect(
      user.click(screen.getByText("Endereço")),
    ).resolves.not.toThrow();
  });
});
