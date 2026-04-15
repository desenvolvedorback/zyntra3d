
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from "lucide-react";
import { askZyntraAssistant } from "@/ai/flows/zyntra-assistant";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ZyntraBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Olá! Sou o ZyntraBot. Como posso ajudar com seu projeto 3D hoje?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await askZyntraAssistant({ message: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: res.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Desculpe, tive um erro no meu processador 3D. Tente novamente!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <Card className="w-80 sm:w-96 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-xl animate-in slide-in-from-bottom-5">
          <CardHeader className="p-4 border-b border-white/5 bg-primary/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Assistente Zyntra 3D
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80 p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed",
                      m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none border border-white/5"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary p-3 rounded-2xl rounded-tl-none border border-white/5">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <Input 
                placeholder="Pergunte sobre materiais, prazos..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-black/40 text-xs"
              />
              <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0 bg-primary">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 p-0 overflow-hidden group border-2 border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Bot className="h-8 w-8 text-white relative z-10" />
        </Button>
      )}
    </div>
  );
}
