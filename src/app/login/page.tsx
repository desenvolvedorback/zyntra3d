"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithPhoneNumber,
  RecaptchaVerifier 
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/shared/Logo";
import { Loader2, Chrome, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const syncUserProfile = async (user: any) => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Usuário 3D",
        role: "customer",
        cpf: "",
        phone: user.phoneNumber || "",
      });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "E-mail ou senha incorretos." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
      toast({ title: "Sucesso!", description: "Login com Google realizado." });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao entrar com Google." });
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendOtp = async () => {
    if (!phone.startsWith('+')) {
      toast({ variant: "destructive", title: "Formato Inválido", description: "Use +55 seguido do DDD e número." });
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      setVerificationId(confirmation);
      toast({ title: "Código Enviado", description: "Verifique seu SMS." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao enviar SMS." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const result = await verificationId.confirm(otp);
      await syncUserProfile(result.user);
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Código Inválido", description: "O código digitado está incorreto." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Logo className="mx-auto mb-4 !h-20 !w-40" />
          <CardTitle className="text-2xl font-headline text-primary">Acesse sua Oficina</CardTitle>
          <CardDescription>Entre para gerenciar seus projetos 3D.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="email">E-mail</TabsTrigger>
              <TabsTrigger value="phone">Smartphone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              <div className="space-y-4">
                {!verificationId ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número do Celular</Label>
                    <Input id="phone" placeholder="+5511999999999" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
                    <Button onClick={handleSendOtp} className="w-full mt-2" disabled={loading || !phone}>
                      {loading ? <Loader2 className="animate-spin" /> : <><Phone className="mr-2 h-4 w-4" /> Enviar Código</>}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Código Recebido</Label>
                    <Input id="otp" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} />
                    <Button onClick={handleVerifyOtp} className="w-full mt-2" disabled={loading || !otp}>
                      {loading ? <Loader2 className="animate-spin" /> : "Confirmar Código"}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou continue com</span></div>
          </div>

          <Button variant="outline" onClick={handleGoogleLogin} className="w-full border-primary/30 hover:bg-primary/10" disabled={loading}>
            <Chrome className="mr-2 h-4 w-4" /> Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-4">
          <p className="text-sm text-muted-foreground">
            Novo na Forge3D? <Link href="/signup" className="text-primary hover:underline">Crie sua conta</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
