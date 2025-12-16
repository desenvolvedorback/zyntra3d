import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { News, Product } from "@/lib/types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { format } from "date-fns";

async function getFeaturedProducts() {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("createdAt", "desc"), limit(4));
    const productSnapshot = await getDocs(q);
    if (productSnapshot.empty) return [];
    return productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

async function getLatestNews() {
  try {
    const newsCollection = collection(db, "news");
    const q = query(newsCollection, orderBy("createdAt", "desc"), limit(3));
    const newsSnapshot = await getDocs(q);
    if (newsSnapshot.empty) return [];
    const newsList = newsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as News;
    });
    return newsList;
  } catch (error) {
    console.error("Error fetching latest news:", error);
    return [];
  }
}

export default async function HomePage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'chocolate-cake');
  const featuredProducts = await getFeaturedProducts();
  const latestNews = await getLatestNews();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] bg-gradient-to-t from-background via-transparent to-transparent">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover -z-10"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="container relative mx-auto flex flex-col items-center justify-center h-full text-center text-primary-foreground">
          <div className="bg-black/30 backdrop-blur-sm p-8 rounded-lg">
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl drop-shadow-lg">
              Sweetness, Just a Link Away
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow-md font-alegreya">
              Welcome to DoceLink, your direct connection to artisanal sweets. Share a link, share the love.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/products">Explore Our Sweets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-headline text-center text-primary mb-12">
            Our Signature Creations
          </h2>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden group flex flex-col">
                  <CardHeader className="p-0">
                    <Link href={`/products/${product.id}`} className="block relative h-64">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={product.imageHint}
                      />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <CardTitle className="font-headline text-2xl text-primary">{product.name}</CardTitle>
                    <p className="text-muted-foreground mt-2 text-lg font-bold">${product.price.toFixed(2)}</p>
                    <div className="mt-auto pt-4">
                       <AddToCartButton product={product} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Our creations will be available soon. Stay tuned!</p>
          )}
        </div>
      </section>

      {/* News Section */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-headline text-center text-primary mb-12">
            Latest News
          </h2>
          {latestNews.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {latestNews.map(article => (
                  <Card key={article.id} className="overflow-hidden">
                     <CardHeader className="p-0">
                       <div className="relative h-56">
                         <Image 
                           src={article.imageUrl}
                           alt={article.title}
                           fill
                           className="object-cover"
                           data-ai-hint={article.imageHint}
                         />
                       </div>
                     </CardHeader>
                     <CardContent className="p-6">
                       <p className="text-sm text-muted-foreground">{format(article.createdAt as Date, 'MMMM d, yyyy')}</p>
                       <CardTitle className="font-headline text-xl text-primary mt-2">{article.title}</CardTitle>
                       <p className="mt-2 text-muted-foreground line-clamp-3">{article.content}</p>
                     </CardContent>
                  </Card>
                ))}
             </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Stay tuned for our latest creations and stories.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
