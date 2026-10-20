"use client";

import { Flex } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import KycDocuments from "@/components/KycDocuments";
import KycStatus from "@/components/KycStatus";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { useSession } from "@/contexts/SessionContext";
import { meOrganization, resolveKycScreen } from "@/functions/kycScreen";

// KYC da organização (fluxo de autenticação Neutra+, passo 6). A tela depende
// do cenário lido no `GET /me` (`organization.status` + `kyc_state`, do banco):
// enviar, reenviar ou corrigir uma recusa abrem o envio de documentos; em
// análise, aprovado e completo mostram a situação. A sessão também garante o
// Bearer exigido por `/kyc/artifacts` e `/kyc/submit`.
function KycContent() {
  const router = useRouter();
  const { profile } = useSession();

  const organization = profile ? meOrganization(profile) : null;
  const screen = organization ? resolveKycScreen(organization) : "submit";
  const goToDashboard = () => router.push("/dashboard");

  return (
    <Flex justify="center" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <Flex w="full" maxW="480px">
        {screen === "review" ||
        screen === "approved" ||
        screen === "complete" ? (
          <KycStatus variant={screen} onContinue={goToDashboard} />
        ) : (
          <KycDocuments
            organizationId={organization?.id}
            variant={screen}
            onFinish={goToDashboard}
          />
        )}
      </Flex>
    </Flex>
  );
}

export default function KycPage() {
  return (
    <AuthenticatedLayout>
      <KycContent />
    </AuthenticatedLayout>
  );
}
