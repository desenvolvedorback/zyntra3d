import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-headline text-2xl font-bold text-primary transition-transform duration-300 ease-in-out hover:scale-105",
        "animate-subtle-rotate",
        className
      )}
      aria-label="DoceLink Home"
    >
      DoceLink
    </Link>
  );
}
