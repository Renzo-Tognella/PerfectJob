import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(255),
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Use apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  website: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  industry: z.string().optional(),
  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(2100)
    .optional(),
  size: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export type CompanyFormInput = z.infer<typeof companySchema>;

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
