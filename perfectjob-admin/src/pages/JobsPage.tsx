import { useEffect, useState } from 'react'
import { Plus, Pencil, X, Users } from 'lucide-react'
import * as jobApi from '../services/api/jobApi'
import type { Job } from '../services/api/jobApi'
import { JobFormModal } from './JobFormModal'

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  const loadJobs = async () => {
    setLoading(true)
    try {
      const data = await jobApi.getAll()
      setJobs(data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleClose = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja encerrar esta vaga?')) return
    try {
      await jobApi.close(id)
      await loadJobs()
    } catch (error) {
      console.error('Failed to close job:', error)
    }
  }

  const handleEdit = (job: Job) => {
    setEditingJob(job)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingJob(null)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setIsModalOpen(false)
    setEditingJob(null)
    await loadJobs()
  }

  const statusBadge = (status: string) => {
    const isActive = status === 'active'
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'Ativa' : 'Encerrada'}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#2B5FC2] text-white rounded-lg hover:bg-[#234D9E] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Vaga
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidaturas</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma vaga encontrada</td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.companyName || '-'}</td>
                    <td className="px-6 py-4">{statusBadge(job.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.applicationsCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(job)}
                          className="p-1.5 text-gray-500 hover:text-[#2B5FC2] hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {job.status === 'active' && (
                          <button
                            onClick={() => handleClose(job.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Encerrar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 text-gray-500 hover:text-[#2B5FC2] hover:bg-blue-50 rounded transition-colors"
                          title="Ver Candidatos"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <JobFormModal
          job={editingJob}
          onClose={() => {
            setIsModalOpen(false)
            setEditingJob(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
