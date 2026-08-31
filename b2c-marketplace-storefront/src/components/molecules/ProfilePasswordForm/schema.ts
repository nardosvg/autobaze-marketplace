import { z } from "zod"

export const profilePasswordSchema = z.object({
  newPassword: z.string().nonempty(""),
  confirmPassword: z.string().nonempty("Digite a nova senha"),
})

export type ProfilePasswordFormData = z.infer<typeof profilePasswordSchema>
