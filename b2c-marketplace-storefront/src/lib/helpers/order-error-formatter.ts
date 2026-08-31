export const orderErrorFormatter = (error: any) => {
  if (error.message === "NEXT_REDIRECT") {
    return null
  }

  if (error.message.includes("Estoque insuficiente")) {
    return "Estoque insuficiente"
  }

  return error.message
}
