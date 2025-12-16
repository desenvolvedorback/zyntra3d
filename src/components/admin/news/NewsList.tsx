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

interface NewsListProps {
  news: News[];
}

export function NewsList({ news }: NewsListProps) {
  return (
    <div className="rounded-md border">
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
  );
}
