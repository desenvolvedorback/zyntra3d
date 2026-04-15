"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/shared/Logo";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const grecaptcha = (window as any).grecaptcha;

    if (!grecaptcha || !grecaptcha.enterprise) {
      toast({
        variant: "destructive",
        title: "Erro de Segurança",
        description: "O reCAPTCHA não carregou corretamente. Recarregue a página.",
      });
      setLoading(false);
      return;
    }
    
    grecaptcha.enterprise.ready(async () => {
      try {
        const token = await grecaptcha.enterprise.execute('6Lfcw7gsAAAAALfTGJxPHLwTEz48zEcO-2m6yLDi', {action: 'SIGNUP'});
        
        if (!token) {
          throw new Error("Falha na verificação de robô.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          cpf,
          phone,
          role: 'customer',
        });

        toast({ title: "Bem-vindo!", description: "Conta criada com sucesso na Forge3D." });
        router.push("/");

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro no Cadastro",
          description: error.message || "Não foi possível criar sua conta.",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Logo className="mx-auto mb-4 !h-20 !w-40" />
          <CardTitle className="text-2xl font-headline text-primary">Crie seu Perfil</CardTitle>
          <CardDescription>Junte-se à maior oficina 3D de Botucatu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Completo</Label>
              <Input id="displayName" placeholder="Seu Nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="+55 (00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={loading} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-4">
          <p className="text-sm text-muted-foreground">
            Já possui conta? <Link href="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
