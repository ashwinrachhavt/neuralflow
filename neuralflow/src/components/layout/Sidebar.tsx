"use client";

import { Home, BarChart2, Settings } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import React from "react";

interface SidebarProps {
  active?: "home" | "stats" | "settings";
  onNavigate?: (to: "home" | "stats" | "settings") => void;
  className?: string;
}

export function Sidebar({ active = "home", onNavigate, className }: SidebarProps) {
  const Item = (
    { id, icon, label }: { id: "home" | "stats" | "settings"; icon: React.ReactNode; label: string }
  ) => (
    <button
      aria-label={label}
      onClick={() => onNavigate?.(id)}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md",
        "text-gray-400 hover:text-white hover:bg-white/10 transition-colors",
        active === id && "bg-white/10 text-white",
      )}
    >
      {icon}
    </button>
  );

  return (
    <aside
      className={cn(
        "sticky top-0 h-svh w-14 shrink-0 border-r border-white/10",
        "bg-[oklch(0.12_0_0)]/95 backdrop-blur supports-[backdrop-filter]:bg-[oklch(0.12_0_0)/0.7]",
        "flex flex-col items-center gap-3 py-4", 
        className
      )}
      aria-label="App sidebar"
    >
      <div className="mt-2 mb-8 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
      
      <SignedIn>
        <Item id="home" icon={<Home className="h-5 w-5" />} label="Home" />
        <Item id="stats" icon={<BarChart2 className="h-5 w-5" />} label="Stats" />
        <Item id="settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
      </SignedIn>
      
      <div className="mt-auto mb-1">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              aria-label="Sign In"
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                ?
              </div>
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </SignedIn>
      </div>
    </aside>
  );
}

export default Sidebar;


