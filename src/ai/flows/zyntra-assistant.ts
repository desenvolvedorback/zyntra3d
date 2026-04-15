
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ZyntraAssistantInputSchema = z.object({
  message: z.string().describe('A pergunta do cliente sobre impressão 3D ou a loja.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});

const ZyntraAssistantOutputSchema = z.object({
  reply: z.string().describe('A resposta útil e técnica do assistente em português do Brasil.'),
});

export async function askZyntraAssistant(input: z.infer<typeof ZyntraAssistantInputSchema>) {
  const { output } = await ai.generate({
    system: `Você é o ZyntraBot, o assistente técnico oficial da Zyntra 3D. 
    A Zyntra 3D é especialista em:
    - Impressão FDM e Resina de alta precisão em Botucatu-SP.
    - Modelagem personalizada de logotipos e action figures.
    - Venda de arquivos STL e packs de projetos.
    
    Regras de Negócio:
    - Seja técnico mas acessível. 
    - Se perguntarem sobre frete, diga que entregamos em Botucatu com taxas baseadas na distância (R$1.50/KM), com frete grátis até 5KM.
    - Materiais: Trabalhamos exclusivamente com PLA e PETG para FDM por enquanto.
    - Prazo médio de produção: 2 a 5 dias úteis.
    - Localização: Botucatu, São Paulo.
    - Sempre tente converter a dúvida em interesse de compra e convide o cliente a adicionar o item ao carrinho ou enviar o link do projeto.`,
    prompt: input.message,
    output: { schema: ZyntraAssistantOutputSchema }
  });
  return output!;
}
