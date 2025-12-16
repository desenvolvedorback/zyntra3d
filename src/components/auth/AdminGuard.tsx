"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run this effect on the client and after the initial auth check is done.
    if (isClient && !loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router, isClient]);

  // While loading auth state or on the server, show a loading spinner.
  // This prevents content flash and hydration errors.
  if (loading || !isClient || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If client-side, auth has loaded, and user is an admin, show the children.
  return <>{children}</>;
}
