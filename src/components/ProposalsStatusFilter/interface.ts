import type { ReactNode } from "react";

export interface ProposalsStatusFilterOption<T extends string> {
  value: T;
  label: string;
  /** Ausente ou zero = contador oculto. */
  count?: number;
}

export interface ProposalsStatusFilterProps<T extends string> {
  /** Nome acessível do grupo de abas. */
  label: string;
  options: ProposalsStatusFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Ações extras ao fim da linha (ex.: "Selecionar em lote"). */
  children?: ReactNode;
}
