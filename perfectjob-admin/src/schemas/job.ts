import { z } from 'zod';

export const workModelOptions = [
  { value: 'REMOTE', label: 'Remoto' },
  { value: 'HYBRID', label: 'Híbrido' },
  { value: 'ON_SITE', label: 'Presencial' },
] as const;

export const experienceLevelOptions = [
  { value: 'INTERN', label: 'Estágio' },
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'MID', label: 'Pleno' },
  { value: 'SENIOR', label: 'Sênior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'SPECIALIST', label: 'Especialista' },
] as const;

export const jobTypeOptions = [
  { value: 'FULL_TIME', label: 'Tempo Integral' },
  { value: 'PART_TIME', label: 'Meio Período' },
  { value: 'CONTRACT', label: 'Contrato' },
  { value: 'FREELANCE', label: 'Freelance' },
] as const;

export const contractTypeOptions = [
  { value: 'CLT', label: 'CLT' },
  { value: 'PJ', label: 'PJ' },
  { value: 'COOPERATIVE', label: 'Cooperado' },
] as const;

export const jobSchema = z
  .object({
    title: z.string().min(3, 'Mínimo 3 caracteres').max(255),
    companyId: z.number().int().positive('Selecione uma empresa'),
    description: z.string().min(50, 'Mínimo 50 caracteres'),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
    workModel: z.enum(['REMOTE', 'HYBRID', 'ON_SITE']),
    experienceLevel: z.enum(['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'SPECIALIST']),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']),
    contractType: z.enum(['CLT', 'PJ', 'COOPERATIVE']),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    locationCity: z.string().optional(),
    locationState: z.string().optional(),
    skills: z.array(z.string()).max(20, 'Máximo 20 skills'),
    expiresAt: z.string().refine((v) => new Date(v) > new Date(), 'Data deve ser no futuro'),
    externalUrl: z
      .string()
      .url('URL inválida')
      .or(z.literal(''))
      .optional(),
  })
  .refine(
    (data) =>
      data.salaryMin === undefined ||
      data.salaryMax === undefined ||
      data.salaryMax >= data.salaryMin,
    { message: 'Salário máximo deve ser maior que mínimo', path: ['salaryMax'] }
  );

export type JobFormInput = z.infer<typeof jobSchema>;
