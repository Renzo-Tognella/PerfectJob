import { useEffect, useState } from 'react'
import { Briefcase, Users, TrendingUp, CheckCircle2 } from 'lucide-react'
import * as jobApi from '../services/api/jobApi'
import type { JobStats } from '../services/api/jobApi'

interface FilledJob {
  id: string
  title: string
  company: string
  hiredCandidate: string
  closedAt: string
}

const FILLED_JOBS_MOCK: FilledJob[] = [
  {
    id: '1',
    title: 'Engenheiro Backend Java',
    company: 'TechCorp',
    hiredCandidate: 'João Silva',
    closedAt: '2026-01-10T14:00:00Z',
  },
  {
    id: '2',
    title: 'Analista de Dados',
    company: 'TechCorp',
    hiredCandidate: 'Maria Santos',
    closedAt: '2026-01-18T09:30:00Z',
  },
]

export function Dashboard() {
  const [stats, setStats] = useState<JobStats | null>(null)
  const [latestApplications, setLatestApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await jobApi.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }
    loadStats()

    setLatestApplications([
      { id: '1', candidateName: 'João Silva', jobTitle: 'Desenvolvedor React Native', status: 'pending', appliedAt: '2026-01-15T10:00:00Z' },
      { id: '2', candidateName: 'Maria Santos', jobTitle: 'Product Designer', status: 'reviewed', appliedAt: '2026-01-15T09:30:00Z' },
    ])
    setLoading(false)
  }, [])

  const statCards = [
    {
      label: 'Vagas Ativas',
      value: stats?.activeJobs ?? 2,
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Candidaturas',
      value: stats?.totalApplications ?? 0,
      icon: Users,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Candidaturas Hoje',
      value: stats?.applicationsToday ?? 0,
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
    },
  ]

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    const labels: Record<string, string> = {
      pending: 'Pendente',
      reviewed: 'Em análise',
      accepted: 'Aceita',
      rejected: 'Recusada',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Dashboard principal */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? '-' : card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Últimas Candidaturas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidato</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody>
                {latestApplications.map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.candidateName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.jobTitle}</td>
                    <td className="px-6 py-4">{statusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.appliedAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Dashboard de vagas efetivadas */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vagas Efetivadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Efetivadas</p>
                <p className="text-3xl font-bold text-gray-900">{FILLED_JOBS_MOCK.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Vagas Preenchidas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contratado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data de fechamento</th>
                </tr>
              </thead>
              <tbody>
                {FILLED_JOBS_MOCK.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.company}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.hiredCandidate}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(job.closedAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
