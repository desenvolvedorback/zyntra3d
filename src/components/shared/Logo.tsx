
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
        src="https://files.catbox.moe/4my793.png"
        alt="Zyntra 3D Logo"
        width={80}
        height={40}
        className="object-contain"
        priority
        unoptimized
        style={{ width: 'auto', height: 'auto' }}
      />
    </Link>
  );
}
