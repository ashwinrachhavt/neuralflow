"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme ?? "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 rounded-full border border-border/60 bg-background/80 hover:bg-foreground/10"
      onClick={handleToggle}
      type="button"
    >
      {mounted && theme === "dark" ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
