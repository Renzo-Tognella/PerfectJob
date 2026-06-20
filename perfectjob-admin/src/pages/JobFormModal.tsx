import { useEffect, useState, type KeyboardEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X as XIcon } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useCreateJob, useUpdateJob } from '@/hooks/useJobs';
import type { Job, JobInput } from '@/services/api/jobApi';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import {
  jobSchema,
  workModelOptions,
  experienceLevelOptions,
  jobTypeOptions,
  contractTypeOptions,
  type JobFormInput,
} from '@/schemas/job';

interface JobFormModalProps {
  job: Job | null;
  onClose: () => void;
  onSave: () => void;
}

const toFormInput = (job: Job | null): JobFormInput => {
  if (!job) {
    const defaultExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return {
      title: '',
      companyId: 0,
      description: '',
      requirements: '',
      benefits: '',
      workModel: 'REMOTE',
      experienceLevel: 'MID',
      jobType: 'FULL_TIME',
      contractType: 'CLT',
      locationCity: '',
      locationState: '',
      skills: [],
      expiresAt: defaultExpires,
    };
  }

  return {
    title: job.title,
    companyId: job.companyId,
    description: job.description,
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    workModel: job.workModel as JobFormInput['workModel'],
    experienceLevel: job.experienceLevel as JobFormInput['experienceLevel'],
    jobType: job.jobType as JobFormInput['jobType'],
    contractType: job.contractType as JobFormInput['contractType'],
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    locationCity: job.locationCity || '',
    locationState: job.locationState || '',
    skills: job.skills || [],
    expiresAt: job.expiresAt ? job.expiresAt.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
};

const toApiPayload = (data: JobFormInput): JobInput => ({
  ...data,
  requirements: data.requirements || '',
  benefits: data.benefits || '',
  salaryMin: data.salaryMin,
  salaryMax: data.salaryMax,
  locationCity: data.locationCity,
  locationState: data.locationState,
  skills: data.skills,
  expiresAt: new Date(data.expiresAt).toISOString(),
});

export function JobFormModal({ job, onClose, onSave }: JobFormModalProps) {
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const [skillInput, setSkillInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<JobFormInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: toFormInput(job),
  });

  const skills = watch('skills') ?? [];

  useEffect(() => {
    reset(toFormInput(job));
  }, [job, reset]);

  const addSkill = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    if (skills.length >= 20) {
      toast.error('Máximo 20 skills');
      return;
    }
    setValue('skills', [...skills, trimmed], { shouldValidate: true });
  };

  const removeSkill = (skill: string) => {
    setValue(
      'skills',
      skills.filter((s) => s !== skill),
      { shouldValidate: true }
    );
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
      setSkillInput('');
    } else if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = toApiPayload(data);
      if (job) {
        await updateJob.mutateAsync({ id: job.id, data: payload });
        toast.success('Vaga atualizada com sucesso');
      } else {
        await createJob.mutateAsync(payload);
        toast.success('Vaga criada com sucesso');
      }
      onSave();
    } catch {
      toast.error('Erro ao salvar vaga. Tente novamente.');
    }
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={job ? 'Editar Vaga' : 'Nova Vaga'}
      size="lg"
    >
      {companiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Controller
            name="companyId"
            control={control}
            render={({ field }) => (
              <Select
                label="Empresa"
                placeholder="Selecione uma empresa"
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={field.value || ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
                error={errors.companyId?.message}
              />
            )}
          />

          <Input
            label="Título"
            {...register('title')}
            error={errors.title?.message}
            placeholder="Ex: Desenvolvedor Full Stack Pleno"
          />

          <Textarea
            label="Descrição"
            {...register('description')}
            error={errors.description?.message}
            rows={3}
            placeholder="Descreva as responsabilidades e o escopo da vaga..."
          />

          <Textarea
            label="Requisitos"
            {...register('requirements')}
            error={errors.requirements?.message}
            rows={3}
            placeholder="Tecnologias, experiências e conhecimentos necessários..."
          />

          <Textarea
            label="Benefícios"
            {...register('benefits')}
            error={errors.benefits?.message}
            rows={2}
            placeholder="VR, VA, plano de saúde, home office..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salário Mínimo"
              type="number"
              min="0"
              {...register('salaryMin', { valueAsNumber: true })}
              error={errors.salaryMin?.message}
              placeholder="5000"
            />
            <Input
              label="Salário Máximo"
              type="number"
              min="0"
              {...register('salaryMax', { valueAsNumber: true })}
              error={errors.salaryMax?.message}
              placeholder="10000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="workModel"
              control={control}
              render={({ field }) => (
                <Select
                  label="Modelo de Trabalho"
                  options={workModelOptions as unknown as { value: string; label: string }[]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.workModel?.message}
                />
              )}
            />
            <Controller
              name="experienceLevel"
              control={control}
              render={({ field }) => (
                <Select
                  label="Nível de Experiência"
                  options={experienceLevelOptions as unknown as { value: string; label: string }[]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.experienceLevel?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="jobType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo de Vaga"
                  options={jobTypeOptions as unknown as { value: string; label: string }[]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jobType?.message}
                />
              )}
            />
            <Controller
              name="contractType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo de Contrato"
                  options={contractTypeOptions as unknown as { value: string; label: string }[]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.contractType?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cidade"
              {...register('locationCity')}
              error={errors.locationCity?.message}
              placeholder="São Paulo"
            />
            <Input
              label="Estado"
              {...register('locationState')}
              error={errors.locationState?.message}
              placeholder="SP"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Skills</label>
            <div className="w-full min-h-10 px-3 py-2 rounded-md border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <div className="flex flex-wrap gap-1.5 items-center">
                {skills.map((skill) => (
                  <Badge key={skill} variant="info" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-600"
                      aria-label={`Remover ${skill}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => {
                    if (skillInput.trim()) {
                      addSkill(skillInput);
                      setSkillInput('');
                    }
                  }}
                  placeholder={skills.length === 0 ? 'Digite uma skill e pressione Enter' : ''}
                  className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                />
              </div>
            </div>
            {errors.skills && <p className="text-sm text-error mt-1">{errors.skills.message}</p>}
            <p className="text-sm text-neutral-500 mt-1">Pressione Enter ou vírgula para adicionar</p>
          </div>

          <Input
            label="Expira em"
            type="date"
            {...register('expiresAt')}
            error={errors.expiresAt?.message}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createJob.isPending || updateJob.isPending}
            >
              Salvar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
