'use server';

/**
 * @fileOverview An AI agent to generate product descriptions from a title and keywords.
 *
 * - generateProductDescription - A function that generates the product description.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the product.'),
  keywords: z.string().describe('Keywords describing the product, separated by commas.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling and descriptive product description, in Brazilian Portuguese.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `Você é um copywriter especialista em e-commerce e tecnologia, especializado em escrever descrições de produtos atraentes para uma oficina de impressão 3D chamada "Zyntra 3D".

  Gere uma descrição de produto em português do Brasil com base no título e palavras-chave fornecidos. 
  A descrição deve destacar a precisão técnica, a qualidade do material (PLA/PETG) e o valor artístico ou funcional do projeto. 
  Enfatize que é um produto tecnológico e inovador.

  Título: {{{title}}}
  Palavras-chave: {{{keywords}}}
  `,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
