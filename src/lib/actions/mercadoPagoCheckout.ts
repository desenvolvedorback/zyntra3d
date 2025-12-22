'use server';

import type { CartItem, UserProfile } from "@/lib/types";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from "@/lib/firebase";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

interface MercadoPagoCheckoutArgs {
  items: CartItem[];
  userProfile: UserProfile;
  deliveryFee: number;
  location: string;
}

// Função para gerar o próximo número de pedido
async function getNextOrderNumber(): Promise<number> {
  const counterRef = doc(db, "counters", "orderCounter");

  try {
    const newOrderNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextNumber;
      if (!counterDoc.exists()) {
        // Se o contador não existir, começa em 1001 e o cria.
        nextNumber = 1001;
        transaction.set(counterRef, { lastNumber: nextNumber });
      } else {
        // Se existir, incrementa o número atual.
        const lastNumber = counterDoc.data().lastNumber || 1000;
        nextNumber = lastNumber + 1;
        transaction.update(counterRef, { lastNumber: nextNumber });
      }
      
      return nextNumber;
    });
    return newOrderNumber;
  } catch (error) {
    console.error("Error in transaction for order number generation: ", error);
    // Fallback: usar um timestamp se a transação falhar.
    return Date.now();
  }
}


export async function mercadoPagoCheckout(args: MercadoPagoCheckoutArgs): Promise<string | null> {
  const { items, userProfile, deliveryFee, location } = args;

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Credenciais do Mercado Pago não configuradas no servidor.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';

  const nameParts = userProfile.displayName?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'N/A';

  const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, "");
  const areaCode = cleanPhone(userProfile.phone).substring(0, 2);
  const phoneNumber = cleanPhone(userProfile.phone).substring(2);
  const cleanCpf = (cpf: string) => cpf.replace(/[^0-9]/g, "");

  try {
    // 1. Gerar o número do pedido
    const orderNumber = await getNextOrderNumber();
    
    // 2. Criar o pedido no Firestore com status 'pending'
    const orderPayload = {
      orderNumber,
      status: 'pending' as const,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) + deliveryFee,
      items: items.map(item => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      customer: {
        id: userProfile.uid,
        name: userProfile.displayName,
        email: userProfile.email,
      },
      delivery: deliveryFee > 0,
      deliveryFee: deliveryFee,
      location: location,
      createdAt: serverTimestamp(),
      paymentId: null,
    };
    const orderRef = doc(collection(db, "orders"));
    await setDoc(orderRef, orderPayload);
    
    // 3. Criar preferência de pagamento do Mercado Pago
    const preferenceItems = items.map((item) => ({
      id: item.productId,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'BRL',
    }));

    if (deliveryFee > 0) {
      preferenceItems.push({
        id: 'delivery_fee',
        title: 'Taxa de Entrega',
        quantity: 1,
        unit_price: deliveryFee,
        currency_id: 'BRL',
      });
    }

    const preferenceBody: any = {
      items: preferenceItems,
      payer: {
        name: firstName,
        surname: lastName,
        email: userProfile.email || '',
        phone: {
          area_code: areaCode,
          number: phoneNumber,
        },
        identification: {
          type: 'CPF',
          number: cleanCpf(userProfile.cpf),
        },
      },
      back_urls: {
        success: `${siteUrl}/`,
        failure: `${siteUrl}/`,
        pending: `${siteUrl}/`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/mp-webhook`,
      metadata: {
        orderId: orderRef.id,
        userId: userProfile.uid,
      },
    };

    const result = await preference.create({ body: preferenceBody });
    
    return result.init_point || null;

  } catch (error: any) {
    console.error("Erro ao criar preferência do Mercado Pago:", error.cause || error.message);
    throw new Error("Falha ao iniciar o processo de pagamento.");
  }
}
```