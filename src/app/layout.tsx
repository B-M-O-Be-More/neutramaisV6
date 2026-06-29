import type { Metadata } from "next";
import { Providers } from "./providers";
import { appFont } from "@/components/ui/fonts";
import MainLayout from "@/components/Layouts/Main";

export const metadata: Metadata = {
  title: "NeutraMais V6",
  description:
    "Plataforma de rede neutra B2B para telecom — marketplace de capacidade de rede entre provedores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={appFont.className}
        style={{
          minHeight: "100dvh",
          fontStyle: "normal",
          fontWeight: 500,
        }}
      >
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
