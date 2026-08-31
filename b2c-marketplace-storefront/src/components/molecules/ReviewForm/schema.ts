import { z } from "zod"

export const reviewSchema = z.object({
  sellerId: z.string(),
  rating: z.number().min(1, "Dê uma nota pra esta loja").max(5),
  opinion: z
    .string()
    .max(300, "A avaliação deve ter menos de 300 caracteres")
    .optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>
