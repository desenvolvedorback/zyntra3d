import { NextResponse } from 'next/server';
import { pagbankCheckout } from '@/lib/actions/pagbankCheckout';
import type { CartItem, UserProfile } from '@/lib/types';


async function verifyRecaptcha(token: string): Promise<boolean> {
    const projectId = process.env.RECAPTCHA_PROJECT_ID;
    const apiKey = process.env.RECAPTCHA_API_KEY;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!projectId || !apiKey || !siteKey) {
        console.error("As variáveis de ambiente do reCAPTCHA Enterprise não estão configuradas corretamente.");
        return false;
    }

    const verificationUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

    try {
        const response = await fetch(verificationUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: {
                    token: token,
                    siteKey: siteKey,
                    expectedAction: "CHECKOUT"
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Erro na API do reCAPTCHA Enterprise: ${response.status} ${response.statusText}`, errorBody);
            return false;
        }

        const data = await response.json();

        if (data.tokenProperties && data.tokenProperties.valid && data.tokenProperties.action === "CHECKOUT") {
            // Recomendação do Google: para ações críticas como pagamento, confie em scores > 0.7
            // Um score baixo indica uma interação possivelmente suspeita (ex: um bot)
            if (data.riskAnalysis && data.riskAnalysis.score >= 0.7) {
                return true;
            } else {
                 console.warn(`reCAPTCHA score baixo detectado: ${data.riskAnalysis.score}`);
                 return false;
            }
        } else {
            console.error("Propriedades do token reCAPTCHA inválidas ou ação não correspondente.", data.tokenProperties);
            return false;
        }
    } catch (error) {
        console.error("Erro ao criar a avaliação do reCAPTCHA Enterprise:", error);
        return false;
    }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      items: CartItem[];
      delivery: boolean;
      deliveryFee: number;
      location: string;
      userProfile: UserProfile;
      recaptchaToken: string;
    };
    
    if (!body.recaptchaToken || !(await verifyRecaptcha(body.recaptchaToken))) {
        return NextResponse.json({ message: "Falha na verificação de segurança. Ação suspeita detectada." }, { status: 403 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ message: "O carrinho está vazio." }, { status: 400 });
    }

    if (!body.userProfile) {
      return NextResponse.json({ message: "Dados do usuário não fornecidos." }, { status: 400 });
    }
    
    const checkoutUrl = await pagbankCheckout({ 
      items: body.items, 
      delivery: body.delivery, 
      deliveryFee: body.deliveryFee, 
      location: body.location,
      userProfile: body.userProfile 
    });

    if (checkoutUrl) {
      return NextResponse.json({ checkoutUrl });
    } else {
      return NextResponse.json({ message: "Não foi possível gerar o link de pagamento." }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API_CHECKOUT_ERROR]', error);
    return NextResponse.json({ message: error.message || "Ocorreu um erro interno." }, { status: 500 });
  }
}
