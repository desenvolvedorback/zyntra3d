
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
        // Verificação imediata e prioritária de Admin
        const isStrictAdmin = currentUser.uid === ADMIN_UID || currentUser.email === ADMIN_EMAIL;
        setIsAdmin(isStrictAdmin);

        // Perfil básico imediato
        const fallbackProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "Zyntra Maker",
          role: isStrictAdmin ? 'admin' : 'customer',
          cpf: "",
          phone: currentUser.phoneNumber || "",
        };
        setUserProfile(fallbackProfile);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
            // Reforça isAdmin se o papel no banco for admin
            if (data.role === 'admin') setIsAdmin(true);
          }
        } catch (error) {
          console.warn("Permissões de leitura de perfil pendentes no Firestore. Usando estado de confiança.");
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
