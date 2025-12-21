import { NextResponse } from 'next/server';
import { pagbankCheckout } from '@/lib/actions/pagbankCheckout';
import type { CartItem } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      items: CartItem[];
      delivery: boolean;
      deliveryFee: number;
      location: string;
    };
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ message: "O carrinho está vazio." }, { status: 400 });
    }
    
    const checkoutUrl = await pagbankCheckout({ 
      items: body.items, 
      delivery: body.delivery, 
      deliveryFee: body.deliveryFee, 
      location: body.location 
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
