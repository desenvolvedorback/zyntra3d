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
          value: Math.round(items.reduce((acc, item) => acc + item.price * item.quantity, 0) * 100) + Math.round(deliveryFee * 100),
        },
      },
    ],
    notification_urls: [`${siteUrl}/api/pagbank-webhook`],
  };

  if (deliveryFee > 0 && location) {
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
          Authorization: `Bearer ${pagbankToken}`,
          "x-api-version": "4.0"
        },
      }
    );
    
    if (response.data.qr_codes && response.data.qr_codes.length > 0) {
      const qrCode = response.data.qr_codes[0];
      if (qrCode.links && qrCode.links.length > 0) {
        const pngLink = qrCode.links.find((link: any) => link.rel === "image/png");
        if (pngLink) return pngLink.href;
      }
    }
    
    if (response.data.links && response.data.links.length > 0) {
      const paymentLink = response.data.links.find((link: any) => link.rel === "PAY");
      if (paymentLink) return paymentLink.href;
    }

    return null;

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      // Handle the whitelist error specifically
      if (errorData.message === 'whitelist access required. Contact PagSeguro.') {
        throw new Error("Acesso à API não autorizado. Verifique a whitelist de IPs na sua conta PagSeguro.");
      }
      
      const errorDetails = errorData.error_messages?.map((e: any) => `${e.field || 'Erro'}: ${e.description}`).join('; ') || 'Ocorreu um erro desconhecido.';
      throw new Error(errorDetails);
    }
    throw error;
  }
}
