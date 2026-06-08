"use client";

import { useSession } from "next-auth/react";
import { MailApp } from "@/components/mail-app";
import { LoginScreen } from "@/components/login-screen";

export default function Home() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginScreen />;
  }

  return <MailApp />;
}