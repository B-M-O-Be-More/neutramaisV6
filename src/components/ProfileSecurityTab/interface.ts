import type { ChangePasswordValues } from "@/schemas/profile";
import type { MeProfile } from "@/services/auth.service";

export interface ProfileSecurityTabProps {
  profile: MeProfile;
  /** Idioma das datas (ex.: "pt-BR"). */
  locale: string;
  /** Navegador da sessão atual (user agent). */
  userAgent: string;
  /** Altera a senha; devolve a chave de tradução do erro, ou null. */
  onChangePassword: (values: ChangePasswordValues) => Promise<string | null>;
  /** Revoga as outras sessões; devolve a chave do erro, ou null. */
  onRevokeOthers: () => Promise<string | null>;
  /** Encerrar a conta passa pelo Suporte/Compliance. */
  closeAccountHref: string;
}
