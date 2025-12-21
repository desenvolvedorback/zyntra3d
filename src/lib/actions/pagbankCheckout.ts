
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
    const isProduction = process.env.NODE_ENV === 'production';
    const prodUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    // Define a URL base de acordo com o ambiente
    const baseUrl = isProduction ? prodUrl : 'http://localhost:3000';

    // Verificações críticas de configuração
    if (!pagbankToken) {
        throw new Error("ERRO FATAL: O token de API do PagBank (PAGBANK_TOKEN) não foi configurado.");
    }
    if (isProduction && !prodUrl) {
        throw new Error("ERRO FATAL: A URL do site (NEXT_PUBLIC_SITE_URL) não foi configurada para o ambiente de produção.");
    }
    if (!baseUrl) {
        throw new Error("ERRO FATAL: A URL base para retornos de pagamento não pôde ser determinada.");
    }
    if (items.length === 0) {
        throw new Error("O carrinho está vazio.");
    }
    if (!userProfile || !userProfile.cpf || !userProfile.phone) {
        const receivedKeys = userProfile ? Object.keys(userProfile).join(', ') : 'perfil nulo';
        throw new Error(`Dados essenciais do cliente (CPF/Telefone) estão faltando. Campos recebidos: [${receivedKeys}]`);
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
    
    // Limpeza e formatação rigorosa dos dados
    const cleanCpf = userProfile.cpf.replace(/[^0-9]/g, '');
    const cleanPhone = userProfile.phone.replace(/[^0-9]/g, '');
    const phoneArea = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);

    if (cleanCpf.length !== 11) throw new Error(`CPF inválido fornecido: '${userProfile.cpf}'.`);
    if (cleanPhone.length < 10 || cleanPhone.length > 11) throw new Error(`Telefone inválido fornecido: '${userProfile.phone}'.`);

    const checkoutData = {
        "reference_id": referenceId,
        "customer": {
            "name": userProfile.displayName,
            "email": userProfile.email,
            "tax_id": cleanCpf,
            "phones": [{ "country": "55", "area": phoneArea, "number": phoneNumber, "type": "MOBILE" }]
        },
        "items": orderItems,
        "redirect_url": `${baseUrl}/order-confirmation?ref=${referenceId}`,
        "notification_urls": [`${baseUrl}/api/webhooks/pagbank`],
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
            console.error("--- ERRO DA API PAGBANK ---");
            console.error("Status:", response.status);
            console.error("Payload Enviado:", JSON.stringify(checkoutData, null, 2));
            console.error("Resposta Recebida:", JSON.stringify(responseBody, null, 2));
            
            const mainError = responseBody.error_messages?.[0];
            if (mainError) {
                const errorDetails = `Erro do PagBank no campo '${mainError.parameter_name}': ${mainError.description}.`;
                throw new Error(errorDetails);
            }
            throw new Error("Falha na comunicação com o PagBank. Verifique os logs do servidor.");
        }
        
        const checkoutLink = responseBody.qr_codes?.[0]?.links?.[0]?.href;

        if (!checkoutLink) {
             console.error("Resposta do PagBank bem-sucedida, mas o link de checkout (qr_codes.links.href) não foi encontrado.", responseBody);
             throw new Error("Link de pagamento não retornado pelo PagBank.");
        }
        
        return checkoutLink;

    } catch (error) {
        console.error("Erro final capturado na função pagbankCheckout:", error);
        // Re-lança o erro (que agora é muito mais detalhado) para a API route.
        throw error;
    }
}
