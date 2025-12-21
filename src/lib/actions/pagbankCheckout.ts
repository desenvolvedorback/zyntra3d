"use server";

import type { CartItem, UserProfile } from "@/lib/types";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { randomUUID } from "crypto";
import axios from "axios";

interface CheckoutProps {
    items: CartItem[];
    delivery: boolean;
    deliveryFee: number;
    location: string;
    userProfile: UserProfile;
}

export async function pagbankCheckout({ items, delivery, deliveryFee, location, userProfile }: CheckoutProps) {
    const pagbankToken = process.env.PAGBANK_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!pagbankToken) {
        throw new Error("PAGBANK_TOKEN não está configurado nas variáveis de ambiente.");
    }
     if (!siteUrl) {
        throw new Error("NEXT_PUBLIC_SITE_URL não está configurado.");
    }
    if (!items || items.length === 0) {
        throw new Error("O carrinho está vazio.");
    }
    if (!userProfile || !userProfile.uid || !userProfile.cpf || !userProfile.phone || !userProfile.displayName || !userProfile.email) {
        throw new Error("Dados do usuário incompletos para finalizar a compra.");
    }

    const referenceId = randomUUID();
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0) + (delivery ? deliveryFee : 0);

    const orderData = {
        referenceId,
        userId: userProfile.uid,
        items: items.map(item => ({ productId: item.productId, name: item.name, quantity: item.quantity, price: item.price })),
        total: totalValue,
        delivery,
        deliveryFee: delivery ? deliveryFee : 0,
        location: delivery ? location : "",
        status: "pending",
        createdAt: serverTimestamp(),
        customer: {
            name: userProfile.displayName,
            email: userProfile.email,
        }
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
    } catch (dbError) {
      console.error("Erro ao salvar pedido no Firestore:", dbError);
      throw new Error("Falha ao registrar o pedido no banco de dados.");
    }

    const orderItems = items.map(item => ({
        "name": item.name,
        "quantity": item.quantity,
        "unit_amount": Math.round(item.price * 100), 
    }));

    if (delivery) {
        orderItems.push({
            "name": "Taxa de Entrega",
            "quantity": 1,
            "unit_amount": Math.round(deliveryFee * 100),
        });
    }
    
    const cleanCpf = userProfile.cpf.replace(/[^0-9]/g, '');
    const cleanPhone = userProfile.phone.replace(/[^0-9]/g, '');
    const phoneArea = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);

    const checkoutData = {
        "reference_id": referenceId,
        "customer": {
            "name": userProfile.displayName,
            "email": userProfile.email,
            "tax_id": cleanCpf,
            "phones": [{ "country": "55", "area": phoneArea, "number": phoneNumber, "type": "MOBILE" }]
        },
        "items": orderItems,
        "redirect_url": `${siteUrl}/order-confirmation?ref=${referenceId}`,
        "notification_urls": [`${siteUrl}/api/webhooks/pagbank`],
        "charges": [{
            "reference_id": `charge_${referenceId}`,
            "description": "Pagamento do pedido Doce Sabor",
            "amount": { "value": Math.round(totalValue * 100), "currency": "BRL" },
            "payment_method": { "type": "PIX" }
        }]
    };

    try {
        const response = await axios.post("https://api.pagbank.com.br/orders", checkoutData, {
            headers: {
                "Authorization": pagbankToken,
                "Content-Type": "application/json",
            },
        });
        
        const responseBody = response.data;
        const checkoutLink = responseBody.qr_codes?.[0]?.links?.[0]?.href;

        if (!checkoutLink) {
             throw new Error("Link de pagamento não retornado pelo PagBank.");
        }
        
        return { checkoutUrl: checkoutLink };

    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorDetails = error.response?.data?.error_messages?.[0];
             if (errorDetails) {
                const errorMessage = `Erro do PagBank no campo '${errorDetails.parameter_name}': ${errorDetails.description}.`;
                throw new Error(errorMessage);
            }
             console.error('Axios error details:', JSON.stringify(error.response?.data, null, 2));
             throw new Error(`Erro de comunicação com PagBank: ${error.message}`);
        }
        
        if (error instanceof Error) {
            throw new Error(`Erro final na função pagbankCheckout: ${error.message}`);
        }
        throw new Error("Ocorreu um erro desconhecido durante o checkout com o PagBank.");
    }
}
