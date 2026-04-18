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

  // Token de Produção Zyntra 3D
  const accessToken = 'APP_USR-4873657725416680-041519-a1a2d79c61cee7f1cfa105b8bd7e2db4-99290797';
  
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zyntra3d.onrender.com';

    // Limpeza de nomes
    const firstName = user.displayName.split(' ')[0] || "Maker";
    const lastName = user.displayName.split(' ').slice(1).join(' ') || "Zyntra";

    // Sanitização de telefone e CPF para o Mercado Pago
    const cleanPhone = user.phone.replace(/\D/g, "");
    const areaCode = cleanPhone.length >= 10 ? cleanPhone.substring(0, 2) : "14";
    const phoneNumber = cleanPhone.length >= 10 ? cleanPhone.substring(2) : "991023986";

    const cleanCpf = user.cpf.replace(/\D/g, "");
    const finalCpf = cleanCpf.length === 11 ? cleanCpf : "00000000000";

    const preferenceItems = items.map((item) => ({
      id: String(item.id),
      title: String(item.title).substring(0, 250),
      quantity: Number(item.quantity),
      unit_price: Number(Number(item.unit_price).toFixed(2)),
      currency_id: 'BRL',
    }));

    if (deliveryFee > 0 && !location.toLowerCase().includes('retirada')) {
      preferenceItems.push({
        id: 'delivery_fee',
        title: 'Zyntra Logística - Entrega',
        quantity: 1,
        unit_price: Number(Number(deliveryFee).toFixed(2)),
        currency_id: 'BRL',
      });
    }

    const result = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          name: firstName,
          surname: lastName,
          email: user.email,
          phone: {
            area_code: areaCode,
            number: phoneNumber,
          },
          identification: {
            type: 'CPF',
            number: finalCpf,
          },
        },
        back_urls: {
          success: `${siteUrl}/order-confirmation/${orderId}`,
          failure: `${siteUrl}/products`,
          pending: `${siteUrl}/order-confirmation/${orderId}`,
        },
        auto_return: 'approved',
        external_reference: orderId,
        metadata: {
          order_id: orderId,
          user_id: user.uid,
        },
      }
    });
    
    return result.init_point || null;

  } catch (error: any) {
    console.error("[Zyntra MP Error]:", error?.message || error);
    return null;
  }
}
