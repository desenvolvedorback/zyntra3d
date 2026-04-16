
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';

const ACCESS_TOKEN = 'APP_USR-4873657725416680-041519-a1a2d79c61cee7f1cfa105b8bd7e2db4-99290797';

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
    revalidatePath('/products');
  } catch (error: any) {
    console.error(`[Zyntra] Erro ao atualizar estoque:`, error.message);
  }
}

async function sendOrderNotificationEmail(order: Order) {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = 'davi.silva36.senai@gmail.com';

  if (!senderEmail || !appPassword) return;

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
    from: `"Zyntra 3D Workshop" <${senderEmail}>`,
    to: toEmail,
    subject: `🚀 NOVO PEDIDO PAGO! #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0a0a0a; color: #fff; border-radius: 10px;">
        <h1 style="color: #a855f7; text-align: center;">Zyntra 3D</h1>
        <div style="background: #111; padding: 15px; border-radius: 8px; border-left: 4px solid #a855f7;">
           <p><strong>Pedido:</strong> #${order.orderNumber}</p>
           <p><strong>Cliente:</strong> ${order.customer?.name}</p>
           <p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
        </div>
        <table style="width: 100%; margin-top: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; color: #a855f7;">Projeto</th>
              <th style="text-align: center; color: #a855f7;">Qtd</th>
              <th style="text-align: right; color: #a855f7;">Valor</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" style="background: #a855f7; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">VER NO PAINEL</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[Zyntra] Erro e-mail:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');
    
    if (paymentId) {
      const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
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
            revalidatePath('/my-orders');
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Zyntra] Webhook Error:", error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
