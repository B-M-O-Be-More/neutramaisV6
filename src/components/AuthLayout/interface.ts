import { ReactNode } from "react";

export interface AuthLayoutProps {
  /** Conteúdo do painel direito (formulário de login/registro). */
  children: ReactNode;
  /**
   * Barra lateral esquerda. Quando omitida, usa o AuthBrandPanel de marketing
   * (padrão do login). O registro injeta aqui sua barra com o stepper do fluxo.
   */
  sidebar?: ReactNode;
}
