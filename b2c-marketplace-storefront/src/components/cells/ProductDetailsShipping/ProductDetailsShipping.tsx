import { ProductPageAccordion } from '@/components/molecules';

export const ProductDetailsShipping = () => {
  return (
    <ProductPageAccordion
      heading='Envio e devolução'
      defaultOpen={false}
    >
      <div className='product-details'>
        <ul>
          <li>
            O frete é calculado no checkout pelo CEP de entrega, com as
            opções e prazos oferecidos pela loja vendedora. Cada loja
            despacha do próprio estoque.
          </li>
          <li>
            Compras pela internet têm direito de arrependimento em até 7
            dias após o recebimento (Código de Defesa do Consumidor), com
            o produto sem uso e na embalagem original. Peças com defeito
            seguem a garantia legal e a do fabricante.
          </li>
          <li>
            Toda compra acompanha nota fiscal emitida pela loja vendedora.
          </li>
        </ul>
      </div>
    </ProductPageAccordion>
  );
};
