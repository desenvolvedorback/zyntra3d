'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';

interface CheckoutItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
}

interface MercadoPagoCheckoutArgs {
  items: CheckoutItem[];
  user: {
    uid: string;
    email: string;
    displayName: string;
    cpf: string;
    phone: string;
  };
  deliveryFee: number;
  location: string;
  orderId: string;
  orderNumber: number;
}

export async function mercadoPagoCheckout(args: MercadoPagoCheckoutArgs): Promise<string | null> {
  const { items, user, deliveryFee, location, orderId } = args;

  // Token de Produção Oficial Zyntra 3D
  const accessToken = 'APP_USR-4873657725416680-041519-a1a2d79c61cee7f1cfa105b8bd7e2db4-99290797';
  
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zyntra3d.onrender.com';

    const nameParts = (user.displayName || "Maker Zyntra").split(' ');
    const firstName = nameParts[0] || "Maker";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Zyntra';

    // Limpeza rigorosa de dados para evitar erro 400 no Mercado Pago
    const cleanPhone = (phone: string) => {
      const p = (phone || "").replace(/[^0-9]/g, "");
      return p.length >= 10 ? p : "14991023986";
    };
    
    const userPhone = cleanPhone(user.phone);
    const areaCode = userPhone.substring(0, 2);
    const phoneNumber = userPhone.substring(2);

    const cleanCpf = (cpf: string) => {
      const c = (cpf || "").replace(/[^0-9]/g, "");
      return c.length === 11 ? c : "00000000000";
    };

    const isDelivery = (deliveryFee || 0) > 0 && !!location && !location.toLowerCase().includes('retirada');
    
    const preferenceItems = items.map((item) => ({
      id: String(item.id),
      title: String(item.title).substring(0, 250),
      quantity: Number(item.quantity),
      unit_price: Number(Number(item.unit_price).toFixed(2)),
      currency_id: 'BRL',
    }));

    if (isDelivery) {
      preferenceItems.push({
        id: 'delivery_fee',
        title: 'Zyntra Logística - Entrega Botucatu',
        quantity: 1,
        unit_price: Number(Number(deliveryFee).toFixed(2)),
        currency_id: 'BRL',
      });
    }

    const preferenceBody = {
      items: preferenceItems,
      payer: {
        name: firstName,
        surname: lastName,
        email: user.email || 'contato@zyntra.com',
        phone: {
          area_code: areaCode,
          number: phoneNumber,
        },
        identification: {
          type: 'CPF',
          number: cleanCpf(user.cpf),
        },
      },
      back_urls: {
        success: `${siteUrl}/order-confirmation/${orderId}`,
        failure: `${siteUrl}/products`,
        pending: `${siteUrl}/order-confirmation/${orderId}`,
      },
      auto_return: 'approved' as const,
      metadata: {
        order_id: orderId,
        user_id: user.uid,
      },
      external_reference: orderId,
    };

    const result = await preference.create({ body: preferenceBody });
    
    if (!result.init_point) {
      console.error("[Zyntra MP] Init point missing in response", result);
      return null;
    }

    return result.init_point;

  } catch (error: any) {
    console.error("[Zyntra MP Error Details]:", error?.message || error);
    return null;
  }
}