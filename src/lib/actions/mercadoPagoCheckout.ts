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
    console.error("Error in transaction for order number generation: ", error);
    return Date.now();
  }
}

export async function mercadoPagoCheckout(args: MercadoPagoCheckoutArgs): Promise<string | null> {
  const { items, userProfile, deliveryFee = 0, location = '', deliverySlot, observation = '', contactPhone = '' } = args;

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Credenciais do Mercado Pago não configuradas no servidor.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zyntra3d.onrender.com';

  const nameParts = userProfile.displayName?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'N/A';

  const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, "");
  const areaCode = cleanPhone(userProfile.phone).substring(0, 2);
  const phoneNumber = cleanPhone(userProfile.phone).substring(2);
  const cleanCpf = (cpf: string) => cpf.replace(/[^0-9]/g, "");

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
        name: userProfile.displayName,
        email: userProfile.email,
      },
      delivery: isDelivery,
      deliveryFee: isDelivery ? (deliveryFee || 0) : 0,
      location: isDelivery ? (location || '') : '',
      deliverySlot: isDelivery ? (deliverySlot || null) : null,
      observation: observation || '',
      contactPhone: contactPhone || '',
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

    if (isDelivery && (deliveryFee || 0) > 0) {
      preferenceItems.push({
        id: 'delivery_fee',
        title: 'Taxa de Entrega (Zyntra Logística)',
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
    };

    const result = await preference.create({ body: preferenceBody });
    return result.init_point || null;

  } catch (error: any) {
    console.error("Erro ao criar preferência do Mercado Pago:", error.cause?.message || error.message);
    throw new Error("Falha ao iniciar o processo de pagamento.");
  }
}
