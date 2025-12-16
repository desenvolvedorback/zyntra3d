"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "docesabor_cookie_consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only run on client
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent !== "true") {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <Card className="max-w-xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            <span>Nós Usamos Cookies</span>
          </CardTitle>
          <CardDescription>
            Este site usa cookies para garantir que você tenha a melhor experiência. Ao continuar, você concorda com nosso uso de cookies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            Aceitar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
