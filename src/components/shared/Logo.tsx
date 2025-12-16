import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Logo({ className }: { className?: string }) {
  const logoImage = PlaceHolderImages.find(p => p.id === 'logo');

  return (
    <Link
      href="/"
      className={cn(
        "relative flex items-center h-14 w-28",
        "transition-transform duration-300 ease-in-out hover:scale-105",
        className
      )}
      aria-label="Doce Sabor Home"
    >
      {logoImage && (
         <Image 
            src={logoImage.imageUrl}
            alt="Doce Sabor Logo"
            fill
            className="object-contain"
            data-ai-hint={logoImage.imageHint}
         />
      )}
    </Link>
  );
}
