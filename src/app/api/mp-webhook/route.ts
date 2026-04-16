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
        // Ignora taxa de entrega na atualização de estoque
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
    console.log(`Estoque atualizado para o pedido #${order.orderNumber}.`);
    revalidatePath('/products');
    revalidatePath('/');
  } catch (error: any) {
    console.error(`Falha ao atualizar estoque:`, error.message);
  }
}

async function sendOrderNotificationEmail(order: Order) {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = process.env.ADMIN_EMAIL_RECIPIENT;

  if (!senderEmail || !appPassword || !toEmail) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: senderEmail, pass: appPassword },
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${item.unit_price.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Zyntra 3D" <${senderEmail}>`,
    to: toEmail,
    subject: `🚀 Novo Pedido Produção! #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #000; color: #fff;">
        <h1 style="color: #a855f7;">Zyntra 3D - Novo Pedido</h1>
        <p>O pedido #${order.orderNumber} foi pago com sucesso.</p>
        <div style="background: #111; padding: 15px; border-radius: 5px;">
           <p><strong>Cliente:</strong> ${order.customer?.name}</p>
           <p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
           ${order.delivery ? `<p><strong>Local:</strong> ${order.location}</p>` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 2px solid #a855f7;">Item</th>
              <th style="text-align: center; border-bottom: 2px solid #a855f7;">Qtd</th>
              <th style="text-align: right; border-bottom: 2px solid #a855f7;">Preço</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin-top: 20px; font-size: 10px; color: #666;">ID MP: ${order.paymentId}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro e-mail:', error);
  }
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ success: false }, { status: 500 });

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
            await updateStock(updatedOrder);
            await sendOrderNotificationEmail(updatedOrder);
            
            if (userId) {
              const cartRef = collection(db, "carts", userId, "items");
              const cartSnapshot = await getDocs(cartRef);
              const batch = writeBatch(db);
              cartSnapshot.forEach(doc => batch.delete(doc.ref));
              await batch.commit();
            }
            
            revalidatePath('/admin/orders');
            console.log(`Pedido ${orderId} aprovado e processado.`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}