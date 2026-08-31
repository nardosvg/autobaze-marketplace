import { Cart } from '@/components/sections';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Carrinho',
};

export default function CartPage({}) {
  return (
    <main className='container grid grid-cols-12'>
      <Suspense fallback={<>Carregando...</>}>
        <Cart />
      </Suspense>
    </main>
  );
}
