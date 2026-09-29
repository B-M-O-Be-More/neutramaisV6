"use client";

import AuthLayout from "@/components/AuthLayout";
import ForgotPassword from "@/components/ForgotPassword";
import ForgotPasswordSidebar from "@/components/ForgotPasswordSidebar";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout sidebar={<ForgotPasswordSidebar />}>
      <ForgotPassword />
    </AuthLayout>
  );
}
