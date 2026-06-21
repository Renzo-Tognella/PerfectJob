import { toJob } from '@/services/api/mappers';
import type { JobResponse } from '@/types/job';

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
});
