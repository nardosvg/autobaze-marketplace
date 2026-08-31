import { z } from 'zod';
import { telefoneValido } from '@/lib/helpers/telefone';

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
    .nonempty('Digite o telefone')
    .refine(telefoneValido, {
      message: 'Digite um telefone válido com DDD, ex.: (41) 99151-7662'
    })
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;
