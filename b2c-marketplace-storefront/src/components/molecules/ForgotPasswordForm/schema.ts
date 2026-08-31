import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z.string().nonempty("Digite o e-mail").email("Digite um e-mail válido"),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
