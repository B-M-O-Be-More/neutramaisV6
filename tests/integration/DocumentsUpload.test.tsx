import React from "react";
import { describe, expect, it, vi } from "vitest";

import DocumentsUpload from "@/components/DocumentsUpload";

import { renderWithProviders, screen, waitFor } from "../test-utils";

const DOCS = [{ id: "cnpj_card", title: "Cartão CNPJ", tag: "basic" as const }];

describe("DocumentsUpload", () => {
  it("notifica os arquivos enviados uma única vez por mudança de estado", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <DocumentsUpload documents={DOCS} onChange={onChange} />,
    );

    // Sincronização inicial: nenhum arquivo enviado ainda.
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  /**
   * Regressão: o efeito de sincronização tinha `onChange` nas dependências. Com um
   * pai que recria a callback a cada render E faz setState na resposta, o ciclo
   * efeito → setState → nova identidade → efeito não fechava, e a aba travava ao
   * selecionar um arquivo (cada volta relia e rehasheava o arquivo inteiro).
   */
  it("não entra em loop quando o pai recria a callback e faz setState", async () => {
    function Parent() {
      const [notifications, setNotifications] = React.useState(0);

      return (
        <>
          <span data-testid="count">{notifications}</span>
          <DocumentsUpload
            documents={DOCS}
            // Identidade nova a cada render — o padrão que causava o loop.
            onChange={() => setNotifications((value) => value + 1)}
          />
        </>
      );
    }

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1"),
    );

    // Deixa o React processar renders pendentes: sem a correção o contador
    // dispararia muito acima de 1.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
