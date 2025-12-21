"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "firebase/auth";
import axios from "axios";

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
}

const profileUpdateSchema = z.object({
  displayName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cpf: z.string().length(14, "O CPF deve ter o formato 000.000.000-00."),
  phone: z.string().min(14, "O telefone deve ter o formato (00) 00000-0000."),
});

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export function EditProfileDialog({ isOpen, onOpenChange, userProfile }: EditProfileDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: userProfile.displayName || "",
      cpf: userProfile.cpf || "",
      phone: userProfile.phone || "",
    },
  });

  const onSubmit = async (data: ProfileUpdateValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não encontrado." });
      return;
    }
    setLoading(true);
    try {
      // 1. Atualiza o nome no Firebase Auth (lado do cliente)
      if (user.displayName !== data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }
      
      // 2. Obtém o token de ID para provar a identidade ao backend
      const idToken = await user.getIdToken();

      // 3. Atualiza o restante no Firestore através de uma API Route segura
      const response = await axios.post('/api/user/update-profile', data, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.data.success) {
        toast({
          title: "Sucesso!",
          description: response.data.message,
        });
        // Forçar a recarga da página para que o AuthProvider busque os novos dados
        window.location.reload(); 
        onOpenChange(false);
      } else {
        throw new Error(response.data.message);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Não foi possível atualizar o perfil.";
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} placeholder="000.000.000-00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} placeholder="(00) 00000-0000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
