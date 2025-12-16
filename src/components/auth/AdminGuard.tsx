"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if loading is finished and the user is not an admin.
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  // While loading, show a spinner. This prevents a flash of the admin page
  // before the redirect can happen.
  if (loading || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished and user is an admin, show the children.
  return <>{children}</>;
}
