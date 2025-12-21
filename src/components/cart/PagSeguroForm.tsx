"use client";

import React from 'react';
import type { CartItem, UserProfile } from "@/lib/types";
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

interface PagSeguroFormProps {
  items: CartItem[];
  userProfile: UserProfile | null;
  deliveryFee: number;
  onCheckoutStart: () => boolean;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

export function PagSeguroForm({ items, userProfile, deliveryFee, onCheckoutStart, isProcessing, setIsProcessing }: PagSeguroFormProps) {
  
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (onCheckoutStart()) {
      // Small delay to ensure state updates before form submission
      setTimeout(() => {
        formRef.current?.submit();
      }, 100);
    }
  };

  const pagseguroEmail = "seu-email-pagseguro@example.com";
  const pagseguroToken = "SEU_TOKEN_PAGSEGURO_AQUI"; // Token de sandbox ou produção

  if (!userProfile) return null;
  
  const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');
  const areaCode = cleanPhone(userProfile.phone).substring(0, 2);
  const phoneNumber = cleanPhone(userProfile.phone).substring(2);

  return (
    <form ref={formRef} action="https://pagseguro.uol.com.br/v2/checkout/payment.html" method="post" target="pagseguro">
      {/* Dados do Vendedor */}
      <input type="hidden" name="receiverEmail" value={pagseguroEmail} />
      <input type="hidden" name="currency" value="BRL" />

      {/* Dados dos Itens */}
      {items.map((item, index) => (
        <React.Fragment key={item.productId}>
          <input type="hidden" name={`itemId${index + 1}`} value={item.productId} />
          <input type="hidden" name={`itemDescription${index + 1}`} value={item.name} />
          <input type="hidden" name={`itemAmount${index + 1}`} value={item.price.toFixed(2)} />
          <input type="hidden" name={`itemQuantity${index + 1}`} value={item.quantity} />
        </React.Fragment>
      ))}

      {/* Taxa de Entrega */}
      {deliveryFee > 0 && (
         <React.Fragment>
          <input type="hidden" name={`itemId${items.length + 1}`} value="TAXA_ENTREGA" />
          <input type="hidden" name={`itemDescription${items.length + 1}`} value="Taxa de Entrega" />
          <input type="hidden" name={`itemAmount${items.length + 1}`} value={deliveryFee.toFixed(2)} />
          <input type="hidden" name={`itemQuantity${items.length + 1}`} value="1" />
        </React.Fragment>
      )}

      {/* Dados do Comprador */}
      <input type="hidden" name="senderName" value={userProfile.displayName || ''} />
      <input type="hidden" name="senderAreaCode" value={areaCode} />
      <input type="hidden" name="senderPhone" value={phoneNumber} />
      <input type="hidden" name="senderEmail" value={userProfile.email || ''} />
      <input type="hidden" name="senderCPF" value={userProfile.cpf.replace(/[^0-9]/g, '')} />

      {/* Configurações de Redirecionamento e Notificação */}
      <input type="hidden" name="redirectURL" value={`${process.env.NEXT_PUBLIC_SITE_URL}/order-confirmation`} />
      
      <Button
        type="submit"
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={isProcessing || !userProfile}
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <CreditCard className="mr-2" />
            {userProfile ? "Pagar com PagSeguro" : "Faça login para pagar"}
          </>
        )}
      </Button>
    </form>
  );
}
