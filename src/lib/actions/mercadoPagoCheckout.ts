
'use server';

import type { UserProfile } from "@/lib/types";
import { MercadoPagoConfig, Preference } from 'mercadopago';

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
  orderId: string;
  orderNumber: number;
  observation?: string;
  contactPhone?: string;
}

export async function mercadoPagoCheckout(args: MercadoPagoCheckoutArgs): Promise<string | null> {
  const { items, userProfile, deliveryFee = 0, location = '', orderId, orderNumber, observation = '', contactPhone = '' } = args;

  // Chaves de produção fornecidas pelo usuário
  const accessToken = 'APP_USR-4873657725416680-041519-a1a2d79c61cee7f1cfa105b8bd7e2db4-99290797';
  
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zyntra3d.onrender.com';

  const nameParts = userProfile.displayName?.split(' ') || ['Maker', 'Zyntra'];
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Zyntra';

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
    const isDelivery = (deliveryFee || 0) > 0 && !!location;
    
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
        success: `${siteUrl}/order-confirmation/${orderId}`,
        failure: `${siteUrl}/products`,
        pending: `${siteUrl}/order-confirmation/${orderId}`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/mp-webhook`,
      metadata: {
        order_id: orderId,
        user_id: userProfile.uid,
      },
      external_reference: orderId,
    };

    const result = await preference.create({ body: preferenceBody });
    
    if (!result.init_point) {
      throw new Error("Não foi possível gerar o link de pagamento.");
    }

    return result.init_point;

  } catch (error: any) {
    console.error("Erro no Mercado Pago:", error.message);
    throw new Error(error.message || "Erro ao iniciar pagamento no Mercado Pago.");
  }
}
