
"use server";

import type { CartItem } from "@/lib/types";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { randomUUID } from "crypto";

interface CheckoutProps {
    items: CartItem[];
    delivery: boolean;
    deliveryFee: number;
    location: string;
}

export async function pagbankCheckout({ items, delivery, deliveryFee, location }: CheckoutProps) {
    const pagbankToken = process.env.PAGBANK_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!pagbankToken) {
        throw new Error("Credenciais do PagBank não configuradas.");
    }
    if (!siteUrl) {
        throw new Error("URL do site não configurada.");
    }
    if (items.length === 0) {
        throw new Error("O carrinho está vazio.");
    }

    const referenceId = randomUUID();

    const orderData = {
        referenceId,
        items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) + (delivery ? deliveryFee : 0),
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
      throw new Error("Falha ao registrar o pedido internamente.");
    }

    const orderItems = items.map(item => ({
        "name": item.name,
        "quantity": item.quantity,
        "unit_amount": Math.round(item.price * 100), // Em centavos
    }));

    if (delivery) {
        orderItems.push({
            "name": "Taxa de Entrega",
            "quantity": 1,
            "unit_amount": Math.round(deliveryFee * 100), // Em centavos
        });
    }

    const checkoutData = {
        "reference_id": referenceId,
        "customer": {
            "name": "Cliente Doce Sabor",
            "email": "cliente@doce-sabor.com",
            "tax_id": "12345678911", 
        },
        "items": orderItems,
        "qr_codes": [
            {
                "amount": {
                    "value": Math.round(orderData.total * 100)
                },
            }
        ],
        "notification_urls": [
            `${siteUrl}/api/webhooks/pagbank`
        ],
        "redirect_url": `${siteUrl}/order-confirmation?ref=${referenceId}`
    };

    try {
        const response = await fetch("https://api.pagseguro.com/orders", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${pagbankToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutData),
        });
        
        const responseBody = await response.json();
        
        if (!response.ok) {
            console.error("PagBank API Error - Status:", response.status);
            console.error("PagBank API Error - Body:", JSON.stringify(responseBody, null, 2));
            throw new Error(responseBody.error_messages?.[0]?.description || "Falha ao criar pedido no PagBank.");
        }
        
        const checkoutLink = responseBody.links?.find((link: any) => link.rel === 'SELF')?.href;

        if (!checkoutLink) {
             throw new Error("Link de checkout não encontrado na resposta do PagBank.");
        }
        
        return checkoutLink;

    } catch (error) {
        console.error("Erro na comunicação com a API do PagBank:", error);
        throw new Error("Falha na comunicação com o PagBank. Tente novamente.");
    }
}
