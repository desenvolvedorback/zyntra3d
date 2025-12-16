"use client";

import type { News } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import Image from "next/image";
import { CellActions } from "./CellActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NewsListProps {
  news: News[];
}

export function NewsList({ news }: NewsListProps) {
  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
         {news.length > 0 ? (
            news.map((article) => (
              <Card key={article.id} className="w-full">
                <CardHeader>
                   <div className="flex gap-4">
                     <Image
                        src={article.imageUrl}
                        alt={article.title}
                        width={64}
                        height={64}
                        className="rounded-md object-cover h-16 w-16"
                      />
                      <div className="flex-grow">
                        <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                        <CardDescription>{format(article.createdAt as Date, 'dd/MM/yyyy')}</CardDescription>
                      </div>
                      <CellActions data={article} />
                   </div>
                </CardHeader>
              </Card>
            ))
         ) : (
            <div className="text-center p-8 text-muted-foreground">
              Nenhuma notícia encontrada.
            </div>
         )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Imagem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-48">Criado em</TableHead>
              <TableHead className="w-16 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.length > 0 ? (
              news.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{format(article.createdAt as Date, 'd \'de\' MMMM, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <CellActions data={article} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma notícia encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
