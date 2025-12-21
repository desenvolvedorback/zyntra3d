
"use server";

import type { CartItem } from "@/lib/types";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { headers } from "next/headers";
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
    if (items.length === 0) {
        throw new Error("O carrinho está vazio.");
    }

    const referenceId = randomUUID();

    // 1. Salvar o pedido no Firestore com status 'pending'
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
    await addDoc(collection(db, "orders"), orderData);

    // 2. Preparar dados para a API do PagBank
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
            "email": "cliente@email.com",
            "tax_id": "12345678901", // CPF/CNPJ - Pode ser genérico ou solicitado
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

    // 3. Chamar a API do PagBank para criar o pedido
    try {
        const response = await fetch("https://api.pagseguro.com/orders", {
            method: "POST",
            headers: {
                "Authorization": pagbankToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error("PagBank API Error:", data);
            throw new Error(data.error_messages?.[0]?.description || "Falha ao criar pedido no PagBank.");
        }
        
        const pixQrCodeLink = data.qr_codes?.[0]?.links?.find((link: any) => link.rel === 'QRCODE.PNG')?.href;
        
        if (!pixQrCodeLink) {
            throw new Error("Link de pagamento PIX não encontrado na resposta do PagBank.");
        }
        
        // Retorna o primeiro link de pagamento disponível (geralmente o link do checkout)
        return data.links?.[0]?.href;

    } catch (error) {
        console.error("Error creating PagBank order:", error);
        throw new Error("Falha na comunicação com o PagBank. Tente novamente.");
    }
}
