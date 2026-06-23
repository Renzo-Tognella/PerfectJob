import { toJob, toResume } from '@/services/api/mappers';
import type { JobResponse } from '@/types/job';
import type { ResumeResponse } from '@/types/resume';

const baseResponse: JobResponse = {
  id: 42,
  companyId: 7,
  companyName: 'TechCorp',
  title: 'Desenvolvedor Backend',
  slug: 'dev-backend-42',
  description: 'Descrição da vaga',
  requirements: 'Java\nSpring',
  benefits: 'VR\nVT',
  salaryMin: 5000,
  salaryMax: 10000,
  salaryCurrency: 'BRL',
  workModel: 'REMOTE',
  experienceLevel: 'MID',
  jobType: 'FULL_TIME',
  contractType: 'CLT',
  locationCity: 'São Paulo',
  locationState: 'SP',
  locationCountry: 'Brasil',
  skills: ['Java', 'Spring'],
  status: 'ACTIVE',
  views: 10,
  applicationsCount: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: '',
  externalUrl: 'https://example.com/job/42',
};

const baseResumeResponse: ResumeResponse = {
  id: 100,
  jobId: 42,
  jobTitle: 'Desenvolvedor Backend',
  pdfStoragePath: '/data/resumes/1/100.pdf',
  createdAt: '2026-06-22T15:30:00.000Z',
  updatedAt: '2026-06-22T15:35:00.000Z',
};

describe('toJob mapper (real backend payload -> view model)', () => {
  it('maps core fields and localizes labels', () => {
    const job = toJob(baseResponse);

    expect(job.id).toBe('42');
    expect(job.slug).toBe('dev-backend-42');
    expect(job.company).toBe('TechCorp');
    expect(job.location).toBe('São Paulo, SP');
    expect(job.workModel).toBe('Remoto');
    expect(job.level).toBe('Pleno');
    expect(job.skills).toEqual(['Java', 'Spring']);
    expect(job.requirements).toEqual(['Java', 'Spring']);
    expect(job.salaryRange).toContain('R$');
  });

  it('falls back to "Remoto" location when city/state are missing', () => {
    const job = toJob({ ...baseResponse, locationCity: '', locationState: '' });
    expect(job.location).toBe('Remoto');
  });

  it('includes externalUrl when present', () => {
    const job = toJob(baseResponse);
    expect(job.externalUrl).toBe('https://example.com/job/42');
  });

  it('sets externalUrl to null when absent', () => {
    const { externalUrl, ...rest } = baseResponse;
    const job = toJob(rest as JobResponse);
    expect(job.externalUrl).toBeNull();
  });
});

describe('toResume mapper (ResumeResponse -> ResumeView)', () => {
  it('maps fields and formats createdAt to pt-BR date', () => {
    const view = toResume(baseResumeResponse);

    expect(view.id).toBe(100);
    expect(view.jobId).toBe(42);
    expect(view.jobTitle).toBe('Desenvolvedor Backend');
    expect(view.createdAt).toBe('2026-06-22T15:30:00.000Z');
    // Brazilian format is DD/MM/YYYY
    expect(view.createdAtLabel).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns empty createdAtLabel for invalid date string', () => {
    const view = toResume({ ...baseResumeResponse, createdAt: '' });
    expect(view.createdAtLabel).toBe('');
  });
});
