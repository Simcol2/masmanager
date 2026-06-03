"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="lg:hidden h-16 sticky top-0 z-30 backdrop-blur-xl" style={{ background: "rgba(253,246,241,0.95)", borderBottom: "1.5px solid rgba(220,200,210,0.5)", boxShadow: "0 2px 8px rgba(180,100,140,0.06)" }}>
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" style={{ color: "#C084A0" }}>
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" style={{ background: "#fff", borderRight: "1.5px solid rgba(220,200,210,0.5)" }}>
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF6B9D,#D4AF37)", boxShadow: "0 2px 8px rgba(255,107,157,0.3)" }}>
              <span style={{ color: "#fff", fontFamily: "serif", fontWeight: "bold", fontSize: "0.9rem" }}>M</span>
            </div>
            <span className="font-display text-base font-bold" style={{ color: "#1E1428" }}>MasManager</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" style={{ color: "#C084A0" }}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#D4AF37" }} />
          </Button>

          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFB3D1,#F5D76E)", color: "#1E1428", fontSize: "0.75rem", fontWeight: "bold" }}>
            {user?.displayName?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
