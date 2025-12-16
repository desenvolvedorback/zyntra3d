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

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="rounded-md border">
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
  );
}
