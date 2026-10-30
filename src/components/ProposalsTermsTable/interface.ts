import type { ReactNode } from "react";

export interface ProposalsTermsRow {
  key: string;
  label: string;
  value: ReactNode;
}

export interface ProposalsTermsTableProps {
  /** Cabeçalho cinza (produto/serviço). Sem ele, a tabela começa nas linhas. */
  title?: ReactNode;
  subtitle?: ReactNode;
  rows: ProposalsTermsRow[];
  /** Faixa ao pé (datas e ID, versão...). */
  footer?: ReactNode;
  /** `muted`: cinza (datas); `accent`: azul (mudança de versão). */
  footerTone?: "muted" | "accent";
  /**
   * `comfortable`: condições da proposta (fundo branco, valor 13px).
   * `compact`: resumo de envio (fundo cinza, valor 12px).
   */
  density?: "comfortable" | "compact";
}
