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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDF6F1" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF6B9D,#D4AF37)", boxShadow: "0 4px 20px rgba(255,107,157,0.3)" }}>
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "1.6rem", fontFamily: "serif" }}>M</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#FF6B9D" }} />
        </div>
      </div>
    );
  }

  // Auth resolved but no user - redirect in flight, render nothing
  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6F1" }}>
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
