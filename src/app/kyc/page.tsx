"use client";

import { Flex } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import KycDocuments from "@/components/KycDocuments";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { useSession } from "@/contexts/SessionContext";

// Envio dos documentos de KYC (fluxo de autenticação Neutra+, passo 6). O
// login traz para cá quem ainda deve documentos; a organização vem da sessão
// (`GET /me`), que também garante o Bearer exigido por `/kyc/artifacts` e
// `/kyc/submit`.
function KycContent() {
  const router = useRouter();
  const { profile } = useSession();

  return (
    <Flex justify="center" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <Flex w="full" maxW="480px">
        <KycDocuments
          organizationId={profile?.organization_id}
          onFinish={() => router.push("/dashboard")}
        />
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
