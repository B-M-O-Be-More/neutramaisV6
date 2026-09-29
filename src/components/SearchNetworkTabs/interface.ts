/** Modo da busca: redes com cobertura perto do usuário ou todo o catálogo. */
export type SearchNetworkTab = "nearby" | "available";

export interface SearchNetworkTabsProps {
  value: SearchNetworkTab;
  onChange: (tab: SearchNetworkTab) => void;
}
