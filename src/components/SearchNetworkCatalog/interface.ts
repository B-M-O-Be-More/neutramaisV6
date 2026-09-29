import type { SearchNetworkTab } from "@/components/SearchNetworkTabs";

export interface SearchNetworkCatalogProps {
  /** Aba ativa — muda o título da seção. */
  tab: SearchNetworkTab;
  /** Texto buscado no banner; soma-se aos filtros do painel. */
  query: string;
  /** "Ver todas": a página limpa a busca do banner (os filtros, a seção). */
  onViewAll: () => void;
}
