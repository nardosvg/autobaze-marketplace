import { z } from 'zod';

export const registerFormSchema = z.object({
  firstName: z
    .string()
    .nonempty('Digite o nome')
    .max(50, 'Nome deve ter até 50 caracteres'),
  lastName: z
    .string()
    .nonempty('Digite o sobrenome')
    .max(50, 'Sobrenome deve ter até 50 caracteres'),
  email: z
    .string()
    .nonempty('Digite o e-mail')
    .email('Invalid email')
    .max(60, 'E-mail deve ter até 60 caracteres'),
  password: z
    .string()
    .nonempty('Digite a senha')
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
      message:
        'A senha deve ter pelo menos uma letra maiúscula, um número e um caractere especial'
    })
    .max(64, 'A senha deve ter até 64 caracteres'),
  phone: z
    .string()
    .min(6, 'Digite o telefone')
    .regex(/^\+?\d+$/, { message: 'O celular deve conter só números' })
    .max(20, 'Telefone deve ter até 20 caracteres')
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;
