export interface AppContextProps {
  isLoadingPages: boolean;
  setLoadingPages: (loading: boolean) => void;
}

export interface AppProviderProps {
  children: React.ReactNode;
}
