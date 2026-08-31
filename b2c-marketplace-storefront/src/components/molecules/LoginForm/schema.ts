import { z } from "zod"

export const loginFormSchema = z.object({
  email: z.string().nonempty("Digite o e-mail").email("Digite um e-mail válido"),
  password: z.string().nonempty("Digite a senha"),
})

export type LoginFormData = z.infer<typeof loginFormSchema>
