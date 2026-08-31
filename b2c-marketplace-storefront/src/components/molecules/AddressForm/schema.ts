import { z } from "zod"

export const addressSchema = z.object({
  addressId: z.string().optional(),
  addressName: z.string().nonempty("Nome do endereço é obrigatório"),
  firstName: z.string().nonempty("Nome é obrigatório"),
  lastName: z.string().nonempty("Sobrenome é obrigatório"),
  address: z.string().nonempty("Endereço é obrigatório"),
  city: z.string().nonempty("Cidade é obrigatória"),
  countryCode: z.string().nonempty("País é obrigatório"),
  postalCode: z.string().nonempty("CEP é obrigatório"),
  company: z.string().optional(),
  province: z.string().optional(),
  phone: z
    .string()
    .nonempty("Telefone é obrigatório")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  metadata: z.record(z.any()).optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>
