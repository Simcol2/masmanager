"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FF006E,#1A73E8)", boxShadow: "0 4px 20px rgba(255,0,110,0.3)" }}>
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "1.5rem" }}>M</span>
          </div>
          <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "#1A73E8" }} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Desktop sidebar — hidden on mobile via CSS media query */}
      <style>{`
        @media (max-width: 1023px) { .desktop-sidebar { display: none !important; } }
        @media (min-width: 1024px) { .mobile-header { display: none !important; } .mobile-nav { display: none !important; } .main-content { margin-left: 16rem; padding-bottom: 0; } }
      `}</style>

      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      <div className="mobile-header">
        <Header />
      </div>

      <main className="main-content" style={{ paddingBottom: "5rem" }}>
        <div style={{ padding: "1.5rem", maxWidth: "80rem", margin: "0 auto" }}>
          {children}
        </div>
      </main>

      <div className="mobile-nav">
        <MobileNav />
      </div>
    </div>
  );
}
