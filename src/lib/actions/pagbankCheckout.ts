"use server";

import type { CartItem, UserProfile } from "@/lib/types";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { randomUUID } from "crypto";

interface CheckoutProps {
    items: CartItem[];
    delivery: boolean;
    deliveryFee: number;
    location: string;
    userProfile: UserProfile;
}

export async function pagbankCheckout({ items, delivery, deliveryFee, location, userProfile }: CheckoutProps) {
    const pagbankToken = process.env.PAGBANK_TOKEN;

    if (!pagbankToken) {
        throw new Error("PAGBANK_TOKEN não está configurado nas variáveis de ambiente.");
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
        "redirect_url": `https://doce-sabor-2f261.web.app/order-confirmation?ref=${referenceId}`,
        "notification_urls": [`https://doce-sabor-2f261.web.app/api/webhooks/pagbank`],
        "charges": [{
            "reference_id": `charge_${referenceId}`,
            "description": "Pagamento do pedido Doce Sabor",
            "amount": { "value": Math.round(totalValue * 100), "currency": "BRL" },
            "payment_method": { "type": "PIX" }
        }]
    };

    try {
        const response = await fetch("https://api.pagbank.com.br/orders", {
            method: "POST",
            headers: {
                "Authorization": pagbankToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutData),
        });
        
        const responseBody = await response.json();
        
        if (!response.ok) {
            const mainError = responseBody.error_messages?.[0];
            if (mainError) {
                const errorDetails = `Erro do PagBank no campo '${mainError.parameter_name}': ${mainError.description}.`;
                throw new Error(errorDetails);
            }
            throw new Error("Falha na comunicação com o PagBank. Verifique os logs do servidor.");
        }
        
        const checkoutLink = responseBody.qr_codes?.[0]?.links?.[0]?.href;

        if (!checkoutLink) {
             throw new Error("Link de pagamento não retornado pelo PagBank.");
        }
        
        return { checkoutUrl: checkoutLink };

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Erro final na função pagbankCheckout: ${error.message}`);
        }
        throw new Error("Ocorreu um erro desconhecido durante o checkout com o PagBank.");
    }
}
