'use server';

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';


async function updateStock(order: Order) {
  try {
    await runTransaction(db, async (transaction) => {
      for (const item of order.items) {
        const productRef = doc(db, 'products', item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Produto com ID ${item.id} não encontrado.`);
        }

        const currentStock = productDoc.data().stock;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`Estoque insuficiente para o produto ${item.title}.`);
        }

        transaction.update(productRef, { stock: newStock });
      }
    });
    console.log(`Estoque atualizado com sucesso para o pedido #${order.orderNumber}.`);
    // Revalidar páginas de produtos após atualização de estoque
    revalidatePath('/products');
    revalidatePath('/');
    order.items.forEach(item => {
      revalidatePath(`/products/${item.id}`);
    });

  } catch (error: any) {
    console.error(`Falha ao atualizar estoque para o pedido #${order.orderNumber}:`, error.message);
    // TODO: Considerar lógica de notificação de falha (ex: enviar um e-mail para o admin)
  }
}

// Função para enviar e-mail de notificação usando Nodemailer com Gmail
async function sendOrderNotificationEmail(order: Order) {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = process.env.ADMIN_EMAIL_RECIPIENT;

  if (!senderEmail || !appPassword || !toEmail) {
    console.error("Credenciais do Gmail ou e-mail do destinatário não configurados. Pulando envio de e-mail.");
    return;
  }

  // Configura o "transportador" do Nodemailer para usar o Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: appPassword,
    },
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${item.unit_price.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Doce Sabor" <${senderEmail}>`,
    to: toEmail,
    subject: `🎉 Novo Pedido Recebido! #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h1 style="color: #333;">🎉 Novo Pedido Recebido! #${order.orderNumber}</h1>
        <p>Um novo pedido foi pago e confirmado na sua loja Doce Sabor.</p>
        
        <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #555;">Detalhes do Pedido</h2>
        <p><strong>Cliente:</strong> ${order.customer?.name || 'N/A'}</p>
        <p><strong>E-mail:</strong> ${order.customer?.email || 'N/A'}</p>
        ${order.delivery ? `<p><strong>Endereço de Entrega:</strong> ${order.location}</p>` : ''}
        
        <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #555;">Itens do Pedido</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Produto</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center;">Qtd.</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <h3 style="text-align: right; margin-top: 20px; color: #333;">Total: R$ ${order.total.toFixed(2)}</h3>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">ID do Pagamento (Mercado Pago): ${order.paymentId}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail de notificação enviado com sucesso para ${toEmail}`);
  } catch (error: any) {
    console.error('Erro detalhado ao enviar e-mail pelo Nodemailer:', error);
  }
}


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

      const orderId = paymentInfo?.metadata?.order_id;
      const userId = paymentInfo?.metadata?.user_id;

      if (!orderId) {
        console.error("Webhook recebido sem orderId nos metadados.");
        return NextResponse.json({ success: false, message: "orderId não encontrado" }, { status: 400 });
      }

      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists() && paymentInfo && paymentInfo.status === 'approved') {
        const orderData = orderSnap.data() as Order;
        
        if (orderData.status === 'pending') {
          await updateDoc(orderRef, {
            status: 'paid',
            paymentId: paymentId,
          });
          
          const updatedOrderSnap = await getDoc(orderRef);
          const updatedOrderData = { id: updatedOrderSnap.id, ...updatedOrderSnap.data() } as Order;

          // 1. Atualiza o estoque
          await updateStock(updatedOrderData);

          // 2. Envia notificação por e-mail
          await sendOrderNotificationEmail(updatedOrderData);
          
          // 3. Limpa o carrinho do usuário
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
          
          // 4. Revalida as páginas do admin
          revalidatePath('/admin/orders');
          revalidatePath('/admin/dashboard');
          
          console.log(`Pedido ${orderId} atualizado para 'pago' e notificação enviada.`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no webhook do Mercado Pago:", error.message, error.cause);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
