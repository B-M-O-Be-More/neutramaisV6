import { ReactNode } from "react";

import type { AppSidebarProps } from "@/components/AppSidebar";

export interface AuthenticatedLayoutProps {
  /** Renderizado só com a sessão válida — pode usar `useSession()`. */
  children: ReactNode;
  badges?: AppSidebarProps["badges"];
}
