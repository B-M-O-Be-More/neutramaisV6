import { ChakraProvider } from "@chakra-ui/react";
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RotatingMessage from "@/components/RotatingMessage";
import { system } from "@/themes/system";

import { render, screen } from "../test-utils";

const MESSAGES = ["Carregando", "Baixando", "Lendo", "Quase lá"];

function renderMessage(loopFrom?: number) {
  return render(
    <ChakraProvider value={system}>
      <RotatingMessage messages={MESSAGES} loopFrom={loopFrom} />
    </ChakraProvider>,
  );
}

/** Um ciclo: os 3 s na tela e o esmaecer até a próxima. */
async function nextMessage() {
  await act(() => {
    vi.advanceTimersByTime(3000);
  });
  await act(() => {
    vi.advanceTimersByTime(300);
  });
}

describe("RotatingMessage", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("troca a mensagem a cada 3 s, esmaecendo no meio", async () => {
    renderMessage();
    expect(screen.getByText("Carregando")).toBeInTheDocument();

    // Começa a esmaecer: o texto ainda é o mesmo, mas some.
    await act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("Carregando")).toHaveStyle({ opacity: "0" });

    await act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText("Baixando")).toHaveStyle({ opacity: "1" });
  });

  it("depois da última, volta para `loopFrom`", async () => {
    renderMessage(2);

    for (let step = 0; step < MESSAGES.length - 1; step += 1) {
      await nextMessage();
    }
    expect(screen.getByText("Quase lá")).toBeInTheDocument();

    await nextMessage();
    expect(screen.getByText("Lendo")).toBeInTheDocument();
  });
});
