"use client";

import { useAuth } from "@/hooks/useAuth";
import { CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminWelcome() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-7 w-48" />;
  }

  const firstName = userProfile?.displayName?.split(" ")[0] || "Admin";

  return <CardTitle>Bem-vindo, {firstName}!</CardTitle>;
}
