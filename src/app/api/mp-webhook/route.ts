'use server';

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Access token do Mercado Pago não encontrado.");
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    // A notificação de webhook do MP para pagamentos só envia o ID
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id;

      // Verificar se o pedido já foi processado para evitar duplicatas
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("paymentId", "==", paymentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`Pedido ${paymentId} já processado. Ignorando.`);
        return NextResponse.json({ success: true, message: "Pedido já existe." });
      }

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo && paymentInfo.status === 'approved') {
        const metadata = paymentInfo.metadata;
        const items = paymentInfo.additional_info?.items || [];
        const deliveryFee = metadata?.delivery_fee || 0;
        
        // Limpa o carrinho do usuário
        if (metadata?.user_id) {
          const cartRef = collection(db, "carts", metadata.user_id, "items");
          const cartSnapshot = await getDocs(cartRef);
          if (!cartSnapshot.empty) {
            const batch = writeBatch(db);
            cartSnapshot.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Carrinho do usuário ${metadata.user_id} limpo.`);
          }
        }
        
        // Salva o novo pedido no Firestore
        await addDoc(collection(db, "orders"), {
          paymentId: paymentId,
          status: 'paid',
          total: paymentInfo.transaction_amount,
          items: items.map((item: any) => ({
            id: item.id,
            title: item.title,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price || item.price || 0), // CORREÇÃO: Usa 'unit_price' ou 'price'
          })),
          customer: {
            id: metadata?.user_id,
            name: metadata?.user_name,
            email: metadata?.user_email,
          },
          delivery: deliveryFee > 0,
          deliveryFee: deliveryFee,
          location: metadata?.delivery_location || '',
          createdAt: serverTimestamp(),
        });
        
        console.log(`Pedido ${paymentId} aprovado e salvo com sucesso.`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no webhook do Mercado Pago:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}