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
    <header className="lg:hidden h-16 bg-void-950/95 backdrop-blur-xl border-b border-void-800/50 sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-void-400">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-void-950 border-void-800/50 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
              <span className="text-gold-400 font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display text-base font-bold gold-text">MasManager</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-void-400 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full" />
          </Button>
          
          <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
            <span className="text-gold-400 text-xs font-bold">
              {user?.displayName?.charAt(0) || "U"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
