"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "zyntra_3d_cookie_consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
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
      <Card className="max-w-xl mx-auto shadow-2xl border-primary/20 bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Cookie className="h-5 w-5" />
            <span>Privacidade & Cookies</span>
          </CardTitle>
          <CardDescription className="text-foreground/80">
            A Zyntra 3D utiliza cookies para melhorar sua experiência na oficina e personalizar seu acesso aos nossos modelos 3D.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAccept} className="w-full sm:w-auto bg-primary hover:bg-primary/80">
            Aceitar e Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
