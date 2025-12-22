'use server';

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Access token do Mercado Pago não encontrado.");
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id;

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      
      const paymentInfo = await payment.get({ id: paymentId });

      // O metadata agora contém o ID do nosso pedido
      const orderId = paymentInfo?.metadata?.order_id;
      const userId = paymentInfo?.metadata?.user_id;

      if (!orderId) {
        console.error("Webhook recebido sem orderId nos metadados.");
        return NextResponse.json({ success: false, message: "orderId não encontrado" }, { status: 400 });
      }

      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      // Apenas atualiza se o pedido existir e o pagamento for aprovado
      if (orderSnap.exists() && paymentInfo && paymentInfo.status === 'approved') {
        
        await updateDoc(orderRef, {
          status: 'paid',
          paymentId: paymentId,
        });
        
        // Limpa o carrinho do usuário após a confirmação do pagamento
        if (userId) {
          const cartRef = collection(db, "carts", userId, "items");
          const cartSnapshot = await getDocs(cartRef);
          if (!cartSnapshot.empty) {
            const batch = writeBatch(db);
            cartSnapshot.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Carrinho do usuário ${userId} limpo.`);
          }
        }
        
        console.log(`Pedido ${orderId} atualizado para 'pago' com sucesso.`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no webhook do Mercado Pago:", error.message, error.cause);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
