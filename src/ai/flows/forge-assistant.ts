
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  message: z.string().describe('A pergunta do cliente sobre impressão 3D ou a loja.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});

const AssistantOutputSchema = z.object({
  reply: z.string().describe('A resposta útil e técnica do assistente em português do Brasil.'),
});

export async function askForgeAssistant(input: z.infer<typeof AssistantInputSchema>) {
  const { output } = await ai.generate({
    system: `Você é o ForgeBot, o assistente técnico da Forge3D. 
    A Forge3D é especialista em:
    - Impressão FDM e Resina de alta precisão em Botucatu-SP.
    - Modelagem personalizada de logotipos e action figures.
    - Venda de arquivos STL e packs de projetos.
    
    Regras:
    - Seja técnico mas acessível. 
    - Se perguntarem sobre frete, diga que entregamos em Botucatu com taxas baseadas na distância (R$1.50/KM).
    - Prazo médio de impressão: 2 a 5 dias úteis dependendo da complexidade.
    - Materiais: PLA, ABS, PETG e Resina.
    - Sempre tente converter a dúvida em interesse de compra.`,
    prompt: input.message,
    output: { schema: AssistantOutputSchema }
  });
  return output!;
}
