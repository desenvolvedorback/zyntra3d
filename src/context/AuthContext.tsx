
"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_UID = 'bVsOaZZTJ4aFDRpJY40TzZaKBWC2';
const ADMIN_EMAIL = 'admin@zyntra.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (currentUser) {
        // Verificação imediata de Admin baseada no UID e Email da conta
        const isStrictAdmin = currentUser.uid === ADMIN_UID && currentUser.email === ADMIN_EMAIL;
        setIsAdmin(isStrictAdmin);

        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Se o documento não existe (ex: primeiro login), criamos um perfil temporário em memória
            // para que a interface não quebre e o usuário consiga navegar
            setUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || "Usuário Zyntra",
              role: isStrictAdmin ? 'admin' : 'customer',
              cpf: "",
              phone: currentUser.phoneNumber || "",
            });
          }
        } catch (error) {
          console.error("Erro ao carregar perfil do Firestore:", error);
          // Fallback em caso de erro de permissão ou rede
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "Usuário Zyntra",
            role: isStrictAdmin ? 'admin' : 'customer',
            cpf: "",
            phone: currentUser.phoneNumber || "",
          });
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
