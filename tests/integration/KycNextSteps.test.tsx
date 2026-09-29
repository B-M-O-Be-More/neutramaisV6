import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import KycNextSteps from "@/components/KycNextSteps";

import { act, renderWithProviders, screen } from "../test-utils";

describe("KycNextSteps", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("anuncia a conta criada e o redirecionamento", () => {
    renderWithProviders(<KycNextSteps onFinish={vi.fn()} />);

    expect(
      screen.getByText("Register.flow.kyc.created.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.kyc.redirecting"),
    ).toBeInTheDocument();
  });

  it("encerra o cadastro sozinho, depois do tempo de leitura", () => {
    const onFinish = vi.fn();
    renderWithProviders(<KycNextSteps onFinish={onFinish} />);

    // Antes do prazo a tela ainda está lá — o usuário precisa conseguir ler.
    act(() => void vi.advanceTimersByTime(2000));
    expect(onFinish).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1500));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("não redireciona depois de desmontar", () => {
    const onFinish = vi.fn();
    const { unmount } = renderWithProviders(
      <KycNextSteps onFinish={onFinish} />,
    );

    unmount();
    act(() => void vi.advanceTimersByTime(10000));

    expect(onFinish).not.toHaveBeenCalled();
  });

  /**
   * Regressão: o formulário passa uma callback inline, com identidade nova a
   * cada render. Se ela entrasse nas dependências do efeito, cada render
   * reiniciaria o timer e o redirecionamento nunca aconteceria.
   */
  it("não reinicia a contagem quando o pai re-renderiza", () => {
    const onFinish = vi.fn();
    const { rerender } = renderWithProviders(
      <KycNextSteps onFinish={onFinish} />,
    );

    act(() => void vi.advanceTimersByTime(2000));
    rerender(<KycNextSteps onFinish={() => onFinish()} />);
    act(() => void vi.advanceTimersByTime(1500));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
