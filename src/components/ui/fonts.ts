import { Roboto, Roboto_Mono } from "next/font/google";

export const appFont = Roboto({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-app",
  display: "swap",
});

// Fonte monoespaçada para valores que precisam ser lidos/copiados caractere a
// caractere (chave do autenticador, códigos de recuperação do MFA). Exposta só
// como variável CSS e consumida pelo token `fonts.mono` do tema.
export const monoFont = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
