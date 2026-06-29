"use client";

import React from "react";
import { AppContextProps, AppProviderProps } from "./interface";

const AppContext = React.createContext<AppContextProps>({
  isLoadingPages: true,
  setLoadingPages: () => {},
});

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoadingPages, setLoadingPages] = React.useState<boolean>(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => setLoadingPages(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AppContext.Provider value={{ isLoadingPages, setLoadingPages }}>
      {children}
    </AppContext.Provider>
  );
};

function useApp() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export { AppProvider, useApp };
