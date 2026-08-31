import { z } from "zod"

export const profileDetailsSchema = z.object({
  firstName: z.string().nonempty("Nome é obrigatório"),
  lastName: z.string().nonempty("Sobrenome é obrigatório"),
  phone: z.string().nonempty("Telefone é obrigatório"),
  email: z.string().nonempty("E-mail é obrigatório"),
})

export type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>
