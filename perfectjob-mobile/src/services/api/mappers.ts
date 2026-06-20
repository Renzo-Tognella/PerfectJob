import type { JobResponse } from '@/types/job'
import type { ApplicationResponse, ApplicationStatus } from '@/types/application'
import type { Job } from '@/types'
import { colors } from '@/design-system/tokens/colors'

const workModelLabels: Record<string, string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ON_SITE: 'Presencial',
}

const experienceLevelLabels: Record<string, string> = {
  INTERN: 'Estágio',
  JUNIOR: 'Júnior',
  MID: 'Pleno',
  SENIOR: 'Sênior',
  LEAD: 'Lead',
  SPECIALIST: 'Especialista',
}

const contractTypeLabels: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  COOPERATIVE: 'Cooperado',
  FREELANCE: 'Freelance',
}

const applicationStatusConfig: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: 'Pendente', bg: colors.warning.light, text: colors.warning.dark },
  REVIEWING: { label: 'Em análise', bg: colors.info.light, text: colors.info.dark },
  ACCEPTED: { label: 'Aceito', bg: colors.success.light, text: colors.success.dark },
  REJECTED: { label: 'Recusado', bg: colors.error.light, text: colors.error.dark },
  HIRED: { label: 'Contratado', bg: colors.success.light, text: colors.success.dark },
}

export function toJob(response: JobResponse): Job & { slug: string; originalId: number } {
  const location = [response.locationCity, response.locationState]
    .filter(Boolean)
    .join(', ') || 'Remoto'

  const salary = response.salaryMin && response.salaryMax
    ? `R$ ${response.salaryMin.toLocaleString('pt-BR')} - R$ ${response.salaryMax.toLocaleString('pt-BR')}`
    : response.salaryMin
      ? `A partir de R$ ${response.salaryMin.toLocaleString('pt-BR')}`
      : undefined

  const postedAt = response.createdAt
    ? formatRelativeTime(response.createdAt)
    : undefined

  return {
    id: String(response.id),
    slug: response.slug,
    originalId: response.id,
    title: response.title,
    company: response.companyName,
    location,
    salaryRange: salary,
    salary: salary,
    skills: response.skills || [],
    postedAt,
    workModel: (workModelLabels[response.workModel] as Job['workModel']) || (response.workModel as Job['workModel']),
    level: experienceLevelLabels[response.experienceLevel] as Job['level'],
    contractType: response.contractType,
    description: response.description,
    requirements: response.requirements ? response.requirements.split('\n').filter(Boolean) : [],
    benefits: response.benefits ? response.benefits.split('\n').filter(Boolean) : [],
  }
}

export interface ApplicationView {
  id: number;
  jobId: number;
  jobTitle: string;
  jobSlug: string;
  companyName: string;
  status: ApplicationStatus;
  statusLabel: string;
  statusBg: string;
  statusText: string;
  createdAt: string;
  createdAtLabel: string;
}

export function toApplication(response: ApplicationResponse): ApplicationView {
  const config = applicationStatusConfig[response.status] || {
    label: response.status,
    bg: colors.neutral[100],
    text: colors.neutral[600],
  }

  return {
    id: response.id,
    jobId: response.jobId,
    jobTitle: response.jobTitle,
    jobSlug: response.jobSlug,
    companyName: response.companyName,
    status: response.status,
    statusLabel: config.label,
    statusBg: config.bg,
    statusText: config.text,
    createdAt: response.createdAt,
    createdAtLabel: new Date(response.createdAt).toLocaleDateString('pt-BR'),
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Agora mesmo'
  if (diffHours < 24) return `${diffHours} hora(s) atrás`
  if (diffDays === 1) return '1 dia atrás'
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR')
}
