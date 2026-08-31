import { model } from "@medusajs/framework/utils"

// Favorito do comprador (o Mercur 2.3.1 nao tem wishlist no core; o
// storefront b2c espera /store/wishlist — implementamos aqui).
export const WishlistItem = model.define("wishlist_item", {
  id: model.id({ prefix: "wli" }).primaryKey(),
  customer_id: model.text().searchable(),
  product_id: model.text(),
})
