import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'logo');

  return (
    <div className="container mx-auto py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-headline text-primary">Nossa História</h1>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            A Doce Sabor nasceu de uma ideia simples: compartilhar a alegria de doces excepcionais e artesanais com todos, em todos os lugares. Acreditamos que um pouco de doçura pode alegrar qualquer dia, e queríamos tornar isso tão fácil quanto compartilhar um link.
          </p>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            Nossa jornada começou em uma pequena cozinha de casa, alimentada pela paixão por confeitaria e pelo desejo de conectar pessoas através de guloseimas deliciosas. Colocamos nosso coração em cada receita, usando apenas os melhores ingredientes para criar doces que são bonitos e inesquecíveis.
          </p>
          <p className="text-lg font-alegreya text-foreground/80 leading-relaxed">
            Da nossa cozinha para as suas mãos, esperamos que cada mordida traga a você tanta felicidade quanto encontramos em criá-la.
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
