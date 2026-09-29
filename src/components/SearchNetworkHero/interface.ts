/** Números da plataforma exibidos à direita do banner, já formatados. */
export interface SearchNetworkHeroStats {
  /** Ex.: "2.418". */
  verifiedSellers: string;
  /** Ex.: "99,5%". */
  averageSla: string;
  /** Ex.: "4 MVP". */
  categories: string;
  /** Ex.: "3". */
  nearbyNetworks: string;
}

export interface SearchNetworkHeroProps {
  /** Redes com cobertura na região do usuário — alimenta o selo do topo. */
  detectedNetworks: number;
  stats: SearchNetworkHeroStats;
  /** Texto da busca (controlado pela página). */
  query: string;
  onQueryChange: (query: string) => void;
  /** Disparado no "Buscar viabilidade" e ao escolher um atalho. */
  onSearch: (query: string) => void;
}
