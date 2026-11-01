import type { ProposalsStatusFilterOption } from "@/components/ProposalsStatusFilter";

export interface ServiceOrdersToolbarProps<T extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  /** Nome acessível das abas de status. */
  filterLabel: string;
  /** Status com contagem; o primeiro é "Todas" (sem filtro). */
  options: ProposalsStatusFilterOption<T>[];
  status: T;
  onStatusChange: (value: T) => void;
}
