export const ProductDetailsShipping = () => {
  return (
    <section className='mt-6 border-t pt-5' data-testid='product-shipping-section'>
      <h4 className='label-lg mb-3 uppercase'>Envio e devolução</h4>
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
    </section>
  );
};
