import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import * as jobApi from '../services/api/jobApi'
import * as companyApi from '../services/api/companyApi'
import type { Job, JobInput } from '../services/api/jobApi'
import type { Company } from '../services/api/companyApi'

interface JobFormModalProps {
  job: Job | null
  onClose: () => void
  onSave: () => void
}

const workModelOptions = [
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'onsite', label: 'Presencial' },
]

const experienceLevelOptions = [
  { value: 'junior', label: 'Júnior' },
  { value: 'mid', label: 'Pleno' },
  { value: 'senior', label: 'Sênior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
]

const jobTypeOptions = [
  { value: 'fulltime', label: 'Tempo Integral' },
  { value: 'parttime', label: 'Meio Período' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Estágio' },
]

const contractTypeOptions = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'cooperado', label: 'Cooperado' },
]

export function JobFormModal({ job, onClose, onSave }: JobFormModalProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<JobInput>>({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    salaryMin: undefined,
    salaryMax: undefined,
    workModel: 'remote',
    experienceLevel: 'mid',
    jobType: 'fulltime',
    contractType: 'clt',
    location: '',
    skills: [],
    expiresAt: '',
    companyId: '',
  })

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyApi.getAll()
        setCompanies(data)
      } catch (error) {
        console.error('Failed to load companies:', error)
      }
    }
    loadCompanies()
  }, [])

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits || '',
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        workModel: job.workModel,
        experienceLevel: job.experienceLevel,
        jobType: job.jobType,
        contractType: job.contractType,
        location: job.location || '',
        skills: job.skills,
        expiresAt: job.expiresAt ? job.expiresAt.split('T')[0] : '',
        companyId: job.companyId,
      })
    }
  }, [job])

  const handleChange = (field: keyof JobInput, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data: JobInput = {
        title: formData.title || '',
        description: formData.description || '',
        requirements: formData.requirements || '',
        benefits: formData.benefits,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        workModel: formData.workModel || 'remote',
        experienceLevel: formData.experienceLevel || 'mid',
        jobType: formData.jobType || 'fulltime',
        contractType: formData.contractType || 'clt',
        location: formData.location,
        skills: formData.skills || [],
        expiresAt: formData.expiresAt,
        companyId: formData.companyId || '',
      }

      if (job) {
        await jobApi.update(job.id, data)
      } else {
        await jobApi.create(data)
      }
      onSave()
    } catch (error) {
      console.error('Failed to save job:', error)
      alert('Erro ao salvar vaga. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const skillsString = (formData.skills || []).join(', ')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {job ? 'Editar Vaga' : 'Nova Vaga'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <select
              value={formData.companyId || ''}
              onChange={(e) => handleChange('companyId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              required
            >
              <option value="">Selecione uma empresa</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos</label>
            <textarea
              value={formData.requirements || ''}
              onChange={(e) => handleChange('requirements', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefícios</label>
            <textarea
              value={formData.benefits || ''}
              onChange={(e) => handleChange('benefits', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário Mínimo</label>
              <input
                type="number"
                value={formData.salaryMin || ''}
                onChange={(e) => handleChange('salaryMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário Máximo</label>
              <input
                type="number"
                value={formData.salaryMax || ''}
                onChange={(e) => handleChange('salaryMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Trabalho</label>
              <select
                value={formData.workModel || 'remote'}
                onChange={(e) => handleChange('workModel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              >
                {workModelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Experiência</label>
              <select
                value={formData.experienceLevel || 'mid'}
                onChange={(e) => handleChange('experienceLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              >
                {experienceLevelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vaga</label>
              <select
                value={formData.jobType || 'fulltime'}
                onChange={(e) => handleChange('jobType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              >
                {jobTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
              <select
                value={formData.contractType || 'clt'}
                onChange={(e) => handleChange('contractType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
              >
                {contractTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (separadas por vírgula)</label>
            <input
              type="text"
              value={skillsString}
              onChange={(e) => handleChange('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="React, TypeScript, Node.js"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expira em</label>
            <input
              type="date"
              value={formData.expiresAt || ''}
              onChange={(e) => handleChange('expiresAt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2B5FC2] rounded-lg hover:bg-[#234D9E] transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
