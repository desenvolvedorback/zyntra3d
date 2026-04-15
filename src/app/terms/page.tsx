
export default function TermsPage() {
  return (
    <div className="container mx-auto py-20 px-6 max-w-4xl">
      <h1 className="text-4xl font-headline text-primary mb-8 text-center">Termos de Uso - Forge3D</h1>
      <div className="prose prose-invert max-w-none space-y-6 font-alegreya text-lg text-muted-foreground">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceitação dos Termos</h2>
          <p>Ao utilizar os serviços da Forge3D, você concorda em cumprir estes termos. Nossa oficina atua como prestadora de serviços de manufatura aditiva e venda de arquivos digitais.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Propriedade Intelectual</h2>
          <p>Arquivos 3D comprados em nossa loja (STL/OBJ) são para uso pessoal e não comercial, a menos que especificado no "Pack 3D" como tendo licença comercial.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Logística e Prazos</h2>
          <p>Impressões 3D são processos artesanais e tecnológicos. O prazo de produção começa após a confirmação do pagamento e varia conforme a complexidade da peça.</p>
        </section>
      </div>
    </div>
  );
}
