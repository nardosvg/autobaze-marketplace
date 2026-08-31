import { AdditionalAttributeProps } from "@/types/product"

export const ProductAdditionalAttributes = ({
  attributes,
}: {
  attributes: AdditionalAttributeProps[]
}) => {

  if (!attributes?.length) return null

  const nonEmptyAttributes = attributes.filter((attribute) => !!attribute && attribute.id)
  if (!nonEmptyAttributes.length) return null

  return (
    <section className="mt-6 border-t pt-5" data-testid="product-additional-attributes-section">
      <h4 className="label-lg mb-3 uppercase">Especificações</h4>
      {nonEmptyAttributes.map((attribute) => (
        <div
          key={attribute.id}
          className="border rounded-sm grid grid-cols-2 text-center label-md"
          data-testid={`product-attribute-${attribute.attribute?.name?.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="border-r py-3">{attribute.attribute?.name}</div>
          <div className="py-3">{attribute.value}</div>
        </div>
      ))}
    </section>
  )
}
