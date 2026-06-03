"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="lg:hidden h-16 sticky top-0 z-30" style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" style={{ color: "#6B7280" }}>
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" style={{ background: "#FFFFFF", borderRight: "1px solid #E5E7EB" }}>
              <Sidebar mobile />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF006E,#1A73E8)", boxShadow: "0 2px 6px rgba(255,0,110,0.3)" }}>
              <span style={{ color: "#fff", fontWeight: "bold", fontSize: "0.85rem" }}>M</span>
            </div>
            <span className="font-display text-base font-bold" style={{ color: "#1E2029" }}>MasManager</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" style={{ color: "#6B7280" }}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#FF006E" }} />
          </Button>

          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ background: "linear-gradient(135deg,#FF006E,#1A73E8)" }}>
            {user?.displayName?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
