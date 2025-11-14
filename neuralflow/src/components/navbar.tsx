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
import { ModeToggle } from "@/components/mode-toggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/boards", label: "Boards" },
  { href: "/notes", label: "Notes" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/pomodoro", label: "Pomodoro" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/todos" className="text-lg font-semibold tracking-tight">
          NeuralFlow
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
              <div className="flex items-center gap-2 text-sm">
                <SignInButton mode="modal" afterSignInUrl="/todos" afterSignUpUrl="/todos">
                  <span className="rounded-full border border-border/70 px-4 py-2 font-medium hover:border-foreground/50">
                    Sign in
                  </span>
                </SignInButton>
                <SignUpButton mode="modal" afterSignUpUrl="/todos" afterSignInUrl="/todos">
                  <span className="rounded-full bg-foreground px-4 py-2 font-medium text-background shadow">
                    Sign up
                  </span>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "size-9" } }} />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
