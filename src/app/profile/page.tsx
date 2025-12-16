"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isClient]);

  if (!isClient || loading || !user || !userProfile) {
    return (
      <div className="container mx-auto py-12 md:py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="items-center text-center">
             <Skeleton className="h-24 w-24 rounded-full mx-auto" />
             <Skeleton className="h-8 w-48 mt-4 mx-auto" />
             <Skeleton className="h-4 w-64 mt-2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const userInitials = userProfile.displayName?.split(' ').map(n => n[0]).join('') || userProfile.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="container mx-auto py-12 md:py-20">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 text-3xl">
              <AvatarImage src={user.photoURL || undefined} alt={userProfile.displayName || ""} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          <CardTitle className="text-3xl font-headline text-primary">{userProfile.displayName}</CardTitle>
          <CardDescription>{userProfile.email}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Função</span>
                    <span className="font-semibold capitalize">{userProfile.role.trim()}</span>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
