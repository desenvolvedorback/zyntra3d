'use server';

import type { CartItem, UserProfile } from "@/lib/types";
import { MercadoPagoConfig, Preference } from 'mercadopago';

interface MercadoPagoCheckoutArgs {
  items: CartItem[];
  userProfile: UserProfile;
  deliveryFee: number;
}

export async function mercadoPagoCheckout(args: MercadoPagoCheckoutArgs): Promise<string | null> {
  const { items, userProfile, deliveryFee } = args;

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Credenciais do Mercado Pago não configuradas no servidor.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';

  // Formata o nome para ter nome e sobrenome
  const nameParts = userProfile.displayName?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'N/A';

  const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, "");
  const areaCode = cleanPhone(userProfile.phone).substring(0, 2);
  const phoneNumber = cleanPhone(userProfile.phone).substring(2);
  const cleanCpf = (cpf: string) => cpf.replace(/[^0-9]/g, "");

  try {
    const preferenceItems = items.map((item) => ({
      id: item.productId,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'BRL',
    }));

    if (deliveryFee > 0) {
      preferenceItems.push({
        id: 'delivery',
        title: 'Taxa de Entrega',
        quantity: 1,
        unit_price: deliveryFee,
        currency_id: 'BRL',
      });
    }

    const result = await preference.create({
      body: {
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
      },
    });
    
    // Para produção, use 'result.init_point'. Para sandbox, 'result.sandbox_init_point'.
    // Vamos retornar o init_point que geralmente funciona para ambos os casos se a conta estiver configurada.
    return result.init_point || null;

  } catch (error: any) {
    console.error("Erro ao criar preferência do Mercado Pago:", error.cause || error.message);
    throw new Error("Falha ao iniciar o processo de pagamento.");
  }
}
