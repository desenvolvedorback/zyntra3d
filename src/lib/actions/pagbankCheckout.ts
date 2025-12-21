"use server";

import type { CartItem, UserProfile } from "@/lib/types";
import axios from "axios";

interface PagBankCheckoutArgs {
  items: CartItem[];
  userProfile: UserProfile;
  deliveryFee: number;
  location: string;
}

export async function pagbankCheckout(args: PagBankCheckoutArgs): Promise<string | null> {
  const { items, userProfile, deliveryFee, location } = args;

  const pagbankToken = process.env.PAGBANK_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';


  if (!pagbankToken) {
    throw new Error("Credenciais do PagBank não configuradas no servidor.");
  }
  
  const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, "");
  const areaCode = cleanPhone(userProfile.phone).substring(0, 2);
  const phoneNumber = cleanPhone(userProfile.phone).substring(2);
  const cleanCpf = (cpf: string) => cpf.replace(/[^0-9]/g, "");

  const orderData = {
    reference_id: `order_${Date.now()}`,
    customer: {
      name: userProfile.displayName,
      email: userProfile.email,
      tax_id: cleanCpf(userProfile.cpf),
      phones: [
        {
          country: "55",
          area: areaCode,
          number: phoneNumber,
          type: "MOBILE",
        },
      ],
    },
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_amount: Math.round(item.price * 100), // Preço em centavos
    })),
    qr_codes: [
      {
        amount: {
          value: Math.round(items.reduce((acc, item) => acc + item.price * item.quantity, deliveryFee) * 100),
        },
      },
    ],
    notification_urls: [`${siteUrl}/api/pagbank-webhook`],
  };

  if (deliveryFee > 0) {
    orderData.items.push({
      name: "Taxa de Entrega",
      quantity: 1,
      unit_amount: Math.round(deliveryFee * 100),
    });
  }

  try {
    const response = await axios.post(
      "https://api.pagseguro.com/orders",
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: pagbankToken,
        },
      }
    );

    const pixQrCode = response.data.qr_codes.find((qr: any) => qr.links.some((link: any) => link.rel === 'image/png'));
    if (pixQrCode) {
       const pixLink = pixQrCode.links.find((link: any) => link.rel === 'image/png');
       return pixLink?.href || null;
    }

    // Fallback to the first payment link if PIX QR code is not available
    if (response.data.links && response.data.links.length > 0) {
      return response.data.links.find((link: any) => link.rel === 'PAY')?.href || null;
    }

    return null;

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Erro detalhado do PagBank:", JSON.stringify(error.response.data, null, 2));
      const errorDetails = error.response.data.error_messages.map((e: any) => `${e.field}: ${e.description}`).join('; ');
      throw new Error(errorDetails);
    }
    throw error;
  }
}
