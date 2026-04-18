
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { News, Product } from "@/lib/types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { applyPromotions } from "@/lib/promotions";
import { Cpu, Printer, Box, Share2, Zap, Newspaper, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

async function getFeaturedProducts() {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("createdAt", "desc"), limit(4));
    const productSnapshot = await getDocs(q);
    
    if (productSnapshot.empty) return [];
    
    const products = productSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id,
        name: data.name || "",
        description: data.description || "",
        price: Number(data.price) || 0,
        imageUrl: data.imageUrl || "",
        imageHint: data.imageHint || "",
        stock: Number(data.stock) || 0,
        category: data.category || "Modelos Prontos",
        isDigital: !!data.isDigital,
        digitalLink: data.digitalLink || "",
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      };
    });

    const promotionsCollection = collection(db, "promotions");
    const promoQuery = query(promotionsCollection, where("isActive", "==", true));
    const promoSnapshot = await getDocs(promoQuery);
    const promotions = promoSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        type: data.type || "product",
        discountType: data.discountType || "percentage",
        discountValue: Number(data.discountValue) || 0,
        productId: data.productId || "",
        isActive: !!data.isActive,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      };
    });
    
    return applyPromotions(products as any, promotions as any);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}

async function getLatestNews() {
  try {
    const newsCollection = collection(db, "news");
    const q = query(newsCollection, orderBy("createdAt", "desc"), limit(3));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        content: data.content || "",
        imageUrl: data.imageUrl || "",
        imageHint: data.imageHint || "",
        createdAt: data.createdAt?.toDate() || new Date(),
      } as News;
    });
  } catch (error) {
    return [];
  }
}

export default async function HomePage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-bg');
  const featuredProducts = await getFeaturedProducts();
  const latestNews = await getLatestNews();

  const categories = [
    { name: "Modelos Prontos", icon: Box },
    { name: "Personalizados", icon: Cpu },
    { name: "Logotipos", icon: Zap },
    { name: "Arquivos 3D", icon: Share2 },
    { name: "Pack 3D", icon: Printer },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover -z-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000"
            priority
            sizes="100vw"
            data-ai-hint="3d printer neon"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="container relative mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-headline text-6xl md:text-8xl leading-none">
              Dê Vida às suas <span className="gradient-text">Ideias com Zyntra 3D</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-alegreya">
              Impressão de alta precisão, modelagem personalizada e os melhores pacotes de arquivos do mercado em Botucatu.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/80 neon-border">
                <Link href="/products">Ver Catálogo</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent/10">
                <Link href="/about">Nossa Tecnologia</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-black/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {categories.map((cat) => (
              <Link href={`/products?category=${cat.name}`} key={cat.name}>
                <Card className="bg-secondary/50 border-white/5 hover:border-primary/50 transition-all group cursor-pointer">
                  <CardContent className="p-8 flex flex-col items-center gap-4">
                    <cat.icon className="h-10 w-10 text-accent group-hover:scale-110 transition-transform" />
                    <span className="font-headline text-lg text-center">{cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-headline text-primary">Projetos em Destaque</h2>
              <p className="text-muted-foreground mt-2">Os itens mais desejados da nossa oficina</p>
            </div>
            <Button variant="link" asChild className="text-accent">
              <Link href="/products">Ver todos os produtos →</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="bg-secondary/30 border-white/5 overflow-hidden group">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-all duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    data-ai-hint={product.category}
                  />
                </div>
                <CardContent className="p-6">
                  <span className="text-xs text-accent/80 uppercase tracking-widest">{product.category}</span>
                  <CardTitle className="font-headline text-2xl mt-1 h-16">{product.name}</CardTitle>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                      {product.promotionalPrice ? (
                        <>
                          <span className="text-primary font-bold text-xl">R$ {product.promotionalPrice.toFixed(2)}</span>
                          <span className="text-muted-foreground line-through text-xs">R$ {product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-primary font-bold text-xl">R$ {product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="w-12 h-12">
                       <AddToCartButton product={product as any} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-24 bg-black/40 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline text-primary mb-4">Zyntra Insights</h2>
            <p className="text-muted-foreground">Novidades e tecnologias direto da nossa oficina 3D</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {latestNews.map((news) => (
              <Link href={`/news/${news.id}`} key={news.id} className="group">
                <Card className="bg-secondary/20 border-white/5 overflow-hidden hover:border-primary/30 transition-all h-full">
                  <div className="relative h-48 overflow-hidden">
                    <Image src={news.imageUrl} alt={news.title} fill className="object-cover transition-transform group-hover:scale-105" unoptimized sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-[10px] text-accent font-bold uppercase mb-2">
                      <Calendar className="h-3 w-3" />
                      {format(news.createdAt, "d 'de' MMM", { locale: ptBR })}
                    </div>
                    <h3 className="font-headline text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">{news.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 font-alegreya">{news.content}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center">
             <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/10">
               <Link href="/news" className="flex items-center gap-2">
                 < Newspaper className="h-4 w-4" /> Ver Todas as Notícias
               </Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
