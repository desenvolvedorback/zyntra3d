"use client";

import type { Product } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CellActions } from "./CellActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id} className="w-full">
              <CardHeader>
                <div className="flex gap-4">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover h-16 w-16"
                  />
                  <div className="flex-grow">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>R${product.price.toFixed(2)}</CardDescription>
                  </div>
                   <CellActions data={product} />
                </div>
              </CardHeader>
              <CardContent>
                {product.stock > 0 ? (
                    <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                      {product.stock} em estoque
                    </Badge>
                  ) : (
                    <Badge variant="outline">Fora de estoque</Badge>
                  )}
              </CardContent>
            </Card>
          ))
        ) : (
           <div className="text-center p-8 text-muted-foreground">
             Nenhum produto encontrado.
           </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Preço</TableHead>
              <TableHead className="w-32">Estoque</TableHead>
              <TableHead className="w-16 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>R${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.stock > 0 ? (
                      <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                        {product.stock} em estoque
                      </Badge>
                    ) : (
                      <Badge variant="outline">Fora de estoque</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CellActions data={product} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
