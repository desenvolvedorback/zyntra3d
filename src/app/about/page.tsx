import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'hero-bg');

  return (
    <div className="container mx-auto py-12 md:py-20 px-6">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-headline text-primary">Nossa Tecnologia</h1>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            A Zyntra 3D nasceu da paixão pela inovação e pela materialização de ideias. Somos uma oficina de manufatura aditiva especializada em transformar conceitos complexos em objetos tangíveis com precisão industrial.
          </p>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            Utilizamos as tecnologias FDM e Resina para atender desde colecionadores exigentes até empresas que buscam prototipagem rápida e funcional. Cada peça que sai da nossa oficina passa por um rigoroso controle de qualidade e acabamento manual.
          </p>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            Localizados em Botucatu-SP, nosso objetivo é democratizar o acesso à impressão 3D de alta qualidade, oferecendo não apenas produtos, mas soluções completas em modelagem e engenharia reversa.
          </p>
        </div>
        <div>
          {aboutImage && (
            <Card className="border-primary/20 bg-black/40 backdrop-blur">
              <CardContent className="p-0">
                <Image
                  src={aboutImage.imageUrl}
                  alt={aboutImage.description}
                  width={600}
                  height={600}
                  className="rounded-lg object-cover w-full aspect-square"
                  data-ai-hint="3d printer neon"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
