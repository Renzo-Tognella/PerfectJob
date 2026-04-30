import { useEffect, useState } from 'react'
import { Briefcase, Users, TrendingUp } from 'lucide-react'
import * as jobApi from '../services/api/jobApi'
import type { JobStats } from '../services/api/jobApi'

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

    // Mock latest applications for MVP
    setLatestApplications([
      { id: '1', candidateName: 'João Silva', jobTitle: 'Desenvolvedor Frontend', status: 'pending', appliedAt: '2024-01-15T10:00:00Z' },
      { id: '2', candidateName: 'Maria Santos', jobTitle: 'Product Designer', status: 'reviewed', appliedAt: '2024-01-15T09:30:00Z' },
      { id: '3', candidateName: 'Pedro Costa', jobTitle: 'Engenheiro Backend', status: 'pending', appliedAt: '2024-01-14T16:00:00Z' },
      { id: '4', candidateName: 'Ana Oliveira', jobTitle: 'Analista de Dados', status: 'accepted', appliedAt: '2024-01-14T14:20:00Z' },
      { id: '5', candidateName: 'Carlos Lima', jobTitle: 'DevOps Engineer', status: 'rejected', appliedAt: '2024-01-13T11:00:00Z' },
    ])
    setLoading(false)
  }, [])

  const statCards = [
    {
      label: 'Vagas Ativas',
      value: stats?.activeJobs ?? 0,
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
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

      {/* Latest Applications */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Últimas Candidaturas</h2>
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
    </div>
  )
}
