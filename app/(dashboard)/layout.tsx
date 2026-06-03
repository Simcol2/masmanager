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

  // Still loading auth state - show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0C" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <span style={{ color: "#D4AF37", fontWeight: "bold", fontSize: "1.5rem", fontFamily: "serif" }}>M</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#D4AF37" }} />
        </div>
      </div>
    );
  }

  // Auth resolved but no user - redirect in flight, render nothing
  if (!user) return null;

  return (
    <div className="min-h-screen bg-void-950">
      <Sidebar />
      <Header />

      <main className="lg:ml-64 pb-20 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
