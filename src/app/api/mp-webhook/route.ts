
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';

/**
 * Atualiza o estoque dos produtos após a confirmação do pagamento.
 */
async function updateStock(order: Order) {
  try {
    await runTransaction(db, async (transaction) => {
      for (const item of order.items) {
        if (item.id === 'delivery_fee') continue;

        const productRef = doc(db, 'products', item.id);
        const productDoc = await transaction.get(productRef);

        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock;
          const newStock = Math.max(0, currentStock - item.quantity);
          transaction.update(productRef, { stock: newStock });
        }
      }
    });
    console.log(`[Zyntra] Estoque atualizado para pedido #${order.orderNumber}.`);
    revalidatePath('/products');
    revalidatePath('/');
  } catch (error: any) {
    console.error(`[Zyntra] Erro ao atualizar estoque:`, error.message);
  }
}

/**
 * Envia notificação por e-mail para o administrador.
 */
async function sendOrderNotificationEmail(order: Order) {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = 'davi.silva36.senai@gmail.com';

  if (!senderEmail || !appPassword) {
    console.warn("[Zyntra] GMAIL_SENDER_EMAIL ou GMAIL_APP_PASSWORD não configurados no .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: senderEmail, pass: appPassword },
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #333; color: #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center; color: #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #a855f7;">R$ ${item.unit_price.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Zyntra 3D - Produção" <${senderEmail}>`,
    to: toEmail,
    subject: `🚀 NOVO PEDIDO PAGO! #${order.orderNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #222; border-radius: 15px; background-color: #0a0a0a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">Zyntra 3D Workshop</h1>
          <p style="color: #666; font-size: 14px;">Nova ordem de impressão confirmada</p>
        </div>
        
        <div style="background: #111; padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #a855f7;">
           <p style="margin: 5px 0;"><strong>Pedido:</strong> #${order.orderNumber}</p>
           <p style="margin: 5px 0;"><strong>Cliente:</strong> ${order.customer?.name}</p>
           <p style="margin: 5px 0;"><strong>Telefone:</strong> ${order.contactPhone || 'Não informado'}</p>
           <p style="margin: 5px 0;"><strong>Total:</strong> <span style="color: #a855f7; font-size: 20px;">R$ ${order.total.toFixed(2)}</span></p>
           ${order.delivery ? `<p style="margin: 5px 0;"><strong>Endereço:</strong> ${order.location}</p>` : '<p style="margin: 5px 0;"><strong>Tipo:</strong> Retirada na Oficina</p>'}
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 2px solid #a855f7; padding: 10px; color: #a855f7;">Projeto</th>
              <th style="text-align: center; border-bottom: 2px solid #a855f7; padding: 10px; color: #a855f7;">Qtd</th>
              <th style="text-align: right; border-bottom: 2px solid #a855f7; padding: 10px; color: #a855f7;">Valor</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        ${order.observation ? `
          <div style="margin-top: 30px; padding: 15px; background: #1a1a1a; border-radius: 8px;">
            <p style="margin: 0; color: #f59e0b; font-size: 12px; font-weight: bold;">OBSERVAÇÕES TÉCNICAS:</p>
            <p style="margin: 5px 0; color: #ccc; font-style: italic;">${order.observation}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #222; pt: 20px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" style="background: #a855f7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">GERENCIAR PRODUÇÃO</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 10px; color: #444; text-align: center;">ID de Transação MP: ${order.paymentId}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Zyntra] E-mail de notificação enviado para ${toEmail}`);
  } catch (error) {
    console.error('[Zyntra] Erro ao enviar e-mail:', error);
  }
}

/**
 * Simula ou integra notificação via WhatsApp.
 * Nota: Para envio real e automático, você precisaria de um serviço como Evolution API, Twilio ou WPPConnect.
 */
async function sendWhatsAppNotification(order: Order) {
  const adminNumber = '5514991023986';
  const message = `🚀 *Zyntra 3D - Novo Pedido!* \n\n` +
                  `*Pedido:* #${order.orderNumber}\n` +
                  `*Cliente:* ${order.customer?.name}\n` +
                  `*Valor:* R$ ${order.total.toFixed(2)}\n` +
                  `*Status:* Pago e pronto para produção!\n\n` +
                  `Acesse o painel para ver os detalhes técnicos.`;

  console.log(`[Zyntra] Notificação WhatsApp para ${adminNumber}: ${message}`);
  
  // Aqui você faria um fetch() para o seu gateway de WhatsApp se tivesse um.
  // Exemplo: await fetch('https://seu-gateway.com/send', { method: 'POST', body: ... })
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ success: false, error: "Token ausente" }, { status: 500 });

  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');
    
    if (paymentId) {
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      const orderId = paymentInfo?.metadata?.order_id || paymentInfo?.external_reference;
      const userId = paymentInfo?.metadata?.user_id;

      if (orderId && paymentInfo.status === 'approved') {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const orderData = orderSnap.data() as Order;
          
          if (orderData.status === 'pending') {
            await updateDoc(orderRef, {
              status: 'paid',
              paymentId: paymentId,
            });
            
            const updatedOrder = { id: orderSnap.id, ...orderData, paymentId };
            
            // Ações Pós-Pagamento
            await updateStock(updatedOrder);
            await sendOrderNotificationEmail(updatedOrder);
            await sendWhatsAppNotification(updatedOrder);
            
            // Limpa o carrinho do usuário
            if (userId) {
              const cartRef = collection(db, "carts", userId, "items");
              const cartSnapshot = await getDocs(cartRef);
              const batch = writeBatch(db);
              cartSnapshot.forEach(doc => batch.delete(doc.ref));
              await batch.commit();
            }
            
            revalidatePath('/admin/orders');
            revalidatePath('/my-orders');
            console.log(`[Zyntra] Pedido ${orderId} processado com sucesso.`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Zyntra] Erro no Webhook:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
