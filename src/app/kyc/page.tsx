"use client";

import { Flex } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";

import KycDocuments from "@/components/KycDocuments";
import KycStatus from "@/components/KycStatus";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { useSession } from "@/contexts/SessionContext";
import { meOrganization, resolveKycScreen } from "@/functions/kycScreen";

// KYC da organização (fluxo de autenticação Neutra+, passo 6). A tela depende
// do cenário lido no `GET /me` (`kyc_state` + `kyc_level`, do banco): primeiro
// envio e subida de nível abrem o envio de documentos; em análise, aprovado,
// completo, recusado e suspenso mostram a situação. Em análise, quem recebeu
// um pedido de correção pode reenviar. A sessão também garante o Bearer
// exigido por `/kyc/artifacts` e `/kyc/submit`.
function KycContent() {
  const router = useRouter();
  const { profile } = useSession();
  const [correcting, setCorrecting] = React.useState(false);

  const organization = profile ? meOrganization(profile) : null;
  const screen = organization ? resolveKycScreen(organization) : "submit";
  const goToDashboard = () => router.push("/dashboard");

  const renderScreen = () => {
    if (screen === "submit" || screen === "upgrade") {
      return (
        <KycDocuments
          organizationId={organization?.id}
          currentLevel={organization?.kyc_level}
          variant={screen}
          onFinish={goToDashboard}
        />
      );
    }
    if (screen === "review" && correcting) {
      return (
        <KycDocuments
          organizationId={organization?.id}
          currentLevel={organization?.kyc_level}
          variant="resubmit"
          onFinish={goToDashboard}
        />
      );
    }
    return (
      <KycStatus
        variant={screen}
        onContinue={goToDashboard}
        onCorrection={() => setCorrecting(true)}
      />
    );
  };

  return (
    <Flex justify="center" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <Flex w="full" maxW="480px">
        {renderScreen()}
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
