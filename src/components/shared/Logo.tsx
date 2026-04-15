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
        src="https://upper-beige-ephwtqnzgo.edgeone.app/Gemini_Generated_Image_d4wmw0d4wmw0d4wm-photoaidcom-cropped.png"
        alt="Zyntra 3D Logo"
        width={80}
        height={20}
        className="object-contain"
        priority
      />
    </Link>
  );
}
