"use client";

import type { PromotionWithProductName } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CellActions } from "./CellActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PromotionListProps {
  promotions: PromotionWithProductName[];
}

export function PromotionList({ promotions }: PromotionListProps) {

  const getDiscountText = (promo: PromotionWithProductName) => {
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}%`;
    }
    return `R$ ${promo.discountValue.toFixed(2)}`;
  };
  
  const getTypeText = (promo: PromotionWithProductName) => {
    if (promo.type === 'delivery') {
        return "Taxa de Entrega";
    }
    return promo.productName || "Produto não encontrado";
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
         {promotions.length > 0 ? (
            promotions.map((promo) => (
              <Card key={promo.id} className="w-full">
                <CardHeader>
                   <div className="flex gap-4">
                      <div className="flex-grow">
                        <CardTitle className="text-lg leading-tight">{promo.name}</CardTitle>
                        <CardDescription>{getTypeText(promo)}</CardDescription>
                      </div>
                      <CellActions data={promo} />
                   </div>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <p className="font-bold text-lg">{getDiscountText(promo)} OFF</p>
                    <Badge variant={promo.isActive ? "secondary" : "outline"}>
                        {promo.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                </CardContent>
              </Card>
            ))
         ) : (
            <div className="text-center p-8 text-muted-foreground">
              Nenhuma promoção encontrada.
            </div>
         )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Promoção</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length > 0 ? (
              promotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.name}</TableCell>
                  <TableCell>{getTypeText(promo)}</TableCell>
                  <TableCell>{getDiscountText(promo)}</TableCell>
                  <TableCell>
                    <Badge variant={promo.isActive ? "secondary" : "outline"}>
                        {promo.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CellActions data={promo} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhuma promoção encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
