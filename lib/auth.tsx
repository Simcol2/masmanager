"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import type { UserRole, User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isRegistrar: boolean;
  isProduction: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Get custom claims (role) from token
        const token = await fbUser.getIdTokenResult();
        const role = (token.claims.role as UserRole) || "production";
        
        setUser({
          id: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || "",
          role,
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date(fbUser.metadata.creationTime || Date.now()),
          updatedAt: new Date(fbUser.metadata.lastSignInTime || Date.now()),
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = user?.role === "admin";
  const isRegistrar = user?.role === "registrar" || isAdmin;
  const isProduction = user?.role === "production" || isAdmin;

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    logout,
    isAdmin,
    isRegistrar,
    isProduction,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireRole(roles: UserRole[]) {
  const { user, loading } = useAuth();
  
  if (loading) return { allowed: false, loading: true };
  if (!user) return { allowed: false, loading: false };
  
  const allowed = roles.includes(user.role) || user.role === "admin";
  return { allowed, loading: false };
}
