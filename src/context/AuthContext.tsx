
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
      setUser(currentUser);

      if (currentUser) {
        // Verificação imediata de Admin baseada no UID e Email da conta para evitar bloqueios por rede
        const isStrictAdmin = currentUser.uid === ADMIN_UID || currentUser.email === ADMIN_EMAIL;
        setIsAdmin(isStrictAdmin);

        // Define um perfil básico imediatamente para que a UI carregue
        const fallbackProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "Usuário Zyntra",
          role: isStrictAdmin ? 'admin' : 'customer',
          cpf: "",
          phone: currentUser.phoneNumber || "",
        };
        setUserProfile(fallbackProfile);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.warn("Firestore offline ou erro de permissão. Usando perfil local temporário.");
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      // Garante que o estado de carregamento termine sempre
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
