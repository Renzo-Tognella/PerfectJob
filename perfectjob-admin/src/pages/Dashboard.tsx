import { Briefcase, Users, TrendingUp, Building2 } from 'lucide-react';
import { useJobStats } from '@/hooks/useJobs';
import { useRecentApplications } from '@/hooks/useApplications';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import type { ApplicationStatus } from '@/types/application';

const statusVariant: Record<ApplicationStatus, 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  REVIEWING: 'info',
  ACCEPTED: 'success',
  REJECTED: 'error',
  HIRED: 'success',
};

const statusLabels: Record<ApplicationStatus, string> = {
  PENDING: 'Pendente',
  REVIEWING: 'Em análise',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
  HIRED: 'Contratado',
};

export function Dashboard() {
  const queryClient = useQueryClient();
  const statsQuery = useJobStats();
  const applicationsQuery = useRecentApplications();

  const isLoading = statsQuery.isLoading || applicationsQuery.isLoading;
  const error = statsQuery.error || applicationsQuery.error;

  const stats = statsQuery.data;
  const applications = applicationsQuery.data ?? [];

  const statCards = [
    {
      label: 'Vagas Ativas',
      value: stats?.activeJobs ?? 0,
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Empresas',
      value: stats?.totalCompanies ?? 0,
      icon: Building2,
      color: 'bg-purple-50 text-purple-600',
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
  ];

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">Erro ao carregar dados do dashboard.</p>
          <Button variant="secondary" size="sm" onClick={handleRetry}>Tentar novamente</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? <Spinner size="sm" /> : card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Últimas Candidaturas</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState title="Nenhuma candidatura encontrada" description="Quando candidatos se inscreverem em vagas, eles aparecerão aqui." />
          ) : (
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
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.candidateName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.jobTitle}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[app.status] || 'neutral'}>
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
