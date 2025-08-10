"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <nav className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className || ''}`}>
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center">
            <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Neural Flow
            </span>
          </Link>
        </div>

        {/* Main Navigation - Only show when signed in */}
        <SignedIn>
          <div className="mr-4 hidden md:flex">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Analytics
              </Link>
              <Link
                href="/settings"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Settings
              </Link>
            </nav>
          </div>
        </SignedIn>

        {/* Right side - Theme Toggle & User */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Mobile Navigation - Only show when signed in */}
            <SignedIn>
              <div className="md:hidden">
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) => {
                    if (e.target.value) window.location.href = e.target.value;
                  }}
                  defaultValue=""
                >
                  <option value="">Navigate...</option>
                  <option value="/">Dashboard</option>
                  <option value="/analytics">Analytics</option>
                  <option value="/settings">Settings</option>
                </select>
              </div>
            </SignedIn>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 px-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Authentication */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                    userButtonPopoverCard: "bg-background border-border",
                    userButtonPopoverActionButton: "text-foreground hover:bg-accent",
                    userButtonPopoverFooter: "hidden"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
