"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { ModeToggle } from "@/components/mode-toggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Plan" },
  { href: "/boards", label: "Board" },
  { href: "/pomodoro", label: "Timer" },
  { href: "/quickchat", label: "Chat" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/60 bg-background/70 backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Dao
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1 text-sm shadow-sm">
            {navLinks.map(link => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 transition-colors",
                    isActive
                      ? "bg-foreground text-background shadow"
                      : "text-muted-foreground hover:bg-foreground/10",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <span className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Sign in
                </span>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "size-9" } }} />
            </SignedIn>
          </div>
        </div>
      </Container>
    </header>
  );
}
