import { NextResponse } from 'next/server';
import { pagbankCheckout } from '@/lib/actions/pagbankCheckout';
import type { CartItem } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, delivery, deliveryFee, location } = body as {
      items: CartItem[];
      delivery: boolean;
      deliveryFee: number;
      location: string;
    };
    
    if (!items || items.length === 0) {
      return NextResponse.json({ message: "O carrinho está vazio." }, { status: 400 });
    }
    
    const checkoutUrl = await pagbankCheckout({ items, delivery, deliveryFee, location });

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
