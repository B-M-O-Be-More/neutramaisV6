import type { ProfilePersonalValues } from "@/schemas/profile";
import type { MeProfile } from "@/services/auth.service";

export interface ProfilePersonalTabProps {
  profile: MeProfile;
  /** Cargo exibido (o papel principal, enquanto não há cargo cadastrado). */
  jobTitle: string;
  /** Idioma das datas (ex.: "pt-BR"). */
  locale: string;
  isEditing: boolean;
  onCancelEdit: () => void;
  /** Salva; devolve a chave de tradução do erro, ou null. */
  onSave: (values: ProfilePersonalValues) => Promise<string | null>;
}
