import type { JobResponse } from '@/types/job';
import type { Job } from '@/types';
import type { ResumeResponse } from '@/types/resume';

const workModelLabels: Record<string, string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ON_SITE: 'Presencial',
};

const experienceLevelLabels: Record<string, string> = {
  INTERN: 'Estágio',
  JUNIOR: 'Júnior',
  MID: 'Pleno',
  SENIOR: 'Sênior',
  LEAD: 'Lead',
  SPECIALIST: 'Especialista',
};

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
    externalUrl: response.externalUrl ?? null,
  }
}

export interface ResumeView {
  id: number;
  jobId: number;
  jobTitle: string;
  createdAt: string;
  createdAtLabel: string;
}

export function toResume(response: ResumeResponse): ResumeView {
  return {
    id: response.id,
    jobId: response.jobId,
    jobTitle: response.jobTitle,
    createdAt: response.createdAt,
    createdAtLabel: formatPtBrDate(response.createdAt),
  }
}

function formatPtBrDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
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
