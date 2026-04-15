import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "relative flex items-center h-14 w-28",
        "transition-transform duration-300 ease-in-out hover:scale-105",
        className
      )}
      aria-label="Zyntra 3D Home"
    >
      <Image 
        src="/logo.png"
        alt="Zyntra 3D Logo"
        width={120}
        height={60}
        className="object-contain"
        priority
      />
    </Link>
  );
}
