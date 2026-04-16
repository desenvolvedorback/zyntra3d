
'use server';

import type { UserProfile } from "@/lib/types";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from "@/lib/firebase";
import { collection, doc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";

interface CheckoutItem {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
}

interface MercadoPagoCheckoutArgs {
  items: CheckoutItem[];
  userProfile: UserProfile;
  deliveryFee?: number;
  location?: string;
  deliverySlot?: 'morning' | 'afternoon';
  observation?: string;
  contactPhone?: string;
}

async function getNextOrderNumber(): Promise<number> {
  const counterRef = doc(db, "counters", "orderCounter");

  try {
    const newOrderNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextNumber;
      if (!counterDoc.exists()) {
        nextNumber = 1001;
        transaction.set(counterRef, { lastNumber: nextNumber });
      } else {
        const lastNumber = counterDoc.data().lastNumber || 1000;
        nextNumber = lastNumber + 1;
        transaction.update(counterRef, { lastNumber: nextNumber });
      }
      
      return nextNumber;
    });
    return newOrderNumber;
  } catch (error) {
    console.error("Error generating order number: ", error);
    return Date.now() % 1000000;
  }
}

export async function mercadoPagoCheckout(args: MercadoPagoCheckoutArgs): Promise<string | null> {
  const { items, userProfile, deliveryFee = 0, location = '', deliverySlot, observation = '', contactPhone = '' } = args;

  // Utilizando chaves de produção fornecidas
  const accessToken = 'APP_USR-4873657725416680-041519-a1a2d79c61cee7f1cfa105b8bd7e2db4-99290797';
  
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zyntra3d.onrender.com';

  const nameParts = userProfile.displayName?.split(' ') || ['Maker', 'Zyntra'];
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Zyntra';

  // Limpeza de dados para MP
  const cleanPhone = (phone: string) => {
    const p = phone.replace(/[^0-9]/g, "");
    return p.length >= 10 ? p : "14999999999";
  };
  
  const userPhone = cleanPhone(userProfile.phone || contactPhone);
  const areaCode = userPhone.substring(0, 2);
  const phoneNumber = userPhone.substring(2);
  const cleanCpf = (cpf: string) => {
    const c = cpf.replace(/[^0-9]/g, "");
    return c.length === 11 ? c : "00000000000";
  };

  try {
    const orderNumber = await getNextOrderNumber();
    const orderRef = doc(collection(db, "orders"));
    const isDelivery = (deliveryFee || 0) > 0 && !!location;

    const orderPayload = {
      orderNumber,
      status: 'pending' as const,
      total: items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) + (isDelivery ? (deliveryFee || 0) : 0),
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      customer: {
        id: userProfile.uid,
        name: userProfile.displayName || "Usuário Zyntra",
        email: userProfile.email || "cliente@zyntra.com",
      },
      delivery: isDelivery,
      deliveryFee: isDelivery ? (deliveryFee || 0) : 0,
      location: isDelivery ? (location || '') : '',
      deliverySlot: isDelivery ? (deliverySlot || null) : null,
      observation: observation || '',
      contactPhone: contactPhone || userProfile.phone || '',
      createdAt: serverTimestamp(),
      paymentId: null,
    };
    
    await setDoc(orderRef, orderPayload);
    
    const preferenceItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: 'BRL',
    }));

    if (isDelivery) {
      preferenceItems.push({
        id: 'delivery_fee',
        title: 'Zyntra Logística - Entrega Botucatu',
        quantity: 1,
        unit_price: deliveryFee || 0,
        currency_id: 'BRL',
      });
    }

    const preferenceBody: any = {
      items: preferenceItems,
      payer: {
        name: firstName,
        surname: lastName,
        email: userProfile.email || 'contato@zyntra.com',
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
        success: `${siteUrl}/order-confirmation/${orderRef.id}`,
        failure: `${siteUrl}/products`,
        pending: `${siteUrl}/order-confirmation/${orderRef.id}`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/mp-webhook`,
      metadata: {
        order_id: orderRef.id,
        user_id: userProfile.uid,
      },
      external_reference: orderRef.id,
    };

    const result = await preference.create({ body: preferenceBody });
    
    if (!result.init_point) {
      throw new Error("Não foi possível gerar o link de pagamento.");
    }

    return result.init_point;

  } catch (error: any) {
    console.error("Erro no Checkout Zyntra:", error.message);
    throw new Error(error.message || "Erro ao iniciar pagamento no Mercado Pago.");
  }
}
