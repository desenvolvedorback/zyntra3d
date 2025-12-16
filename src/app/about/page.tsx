import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'assorted-macarons');

  return (
    <div className="container mx-auto py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-headline text-primary">Our Story</h1>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            DoceLink was born from a simple idea: to share the joy of exceptional, handcrafted sweets with everyone, everywhere. We believe that a little bit of sweetness can brighten any day, and we wanted to make it as easy as sharing a link.
          </p>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            Our journey began in a small home kitchen, fueled by a passion for baking and a desire to connect people through delicious treats. We pour our hearts into every recipe, using only the finest ingredients to create confections that are both beautiful and unforgettable.
          </p>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            From our kitchen to your hands, we hope every bite brings you as much happiness as we find in creating it.
          </p>
        </div>
        <div>
          {aboutImage && (
            <Card>
              <CardContent className="p-0">
                <Image
                  src={aboutImage.imageUrl}
                  alt={aboutImage.description}
                  width={600}
                  height={600}
                  className="rounded-lg object-cover w-full h-full"
                  data-ai-hint={aboutImage.imageHint}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
