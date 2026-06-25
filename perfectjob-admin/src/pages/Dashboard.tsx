import { Briefcase, Building2, FileText, TrendingUp } from 'lucide-react';
import { useJobStats } from '@/hooks/useJobs';
import { useResumeStats, useResumes, useResumesByJob } from '@/hooks/useResumes';
import { useAuthStore } from '@/store/useAuthStore';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';

export function Dashboard() {
  const queryClient = useQueryClient();
  const statsQuery = useJobStats();
  const resumeStatsQuery = useResumeStats();
  const recentResumesQuery = useResumes(0, 5);
  const byJobQuery = useResumesByJob();

  const isAdmin = useAuthStore((s) => s.user?.role) === 'ADMIN';

  const isLoading = statsQuery.isLoading || resumeStatsQuery.isLoading;
  const error = statsQuery.error || resumeStatsQuery.error;

  const stats = statsQuery.data;
  const resumeStats = resumeStatsQuery.data;
  const recentResumes = recentResumesQuery.data?.content ?? [];
  const byJob = byJobQuery.data ?? [];
  const maxResumeCount = Math.max(...byJob.map((d) => d.resumeCount), 1);

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
      label: 'Currículos Gerados',
      value: resumeStats?.totalResumes ?? 0,
      icon: FileText,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Currículos Hoje',
      value: resumeStats?.resumesToday ?? 0,
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
    queryClient.invalidateQueries({ queryKey: ['resumes-by-job'] });
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
          <h2 className="text-lg font-semibold text-gray-900">Últimos Currículos</h2>
        </div>
        <div className="overflow-x-auto">
          {recentResumesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : recentResumes.length === 0 ? (
            <EmptyState
              title="Nenhum currículo gerado"
              description="Quando candidatos gerarem currículos para vagas, eles aparecerão aqui."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidato</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentResumes.map((resume) => (
                  <tr key={resume.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{resume.candidateName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{resume.jobTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(resume.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-lg shadow-sm mt-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Currículos por Vaga</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Quantos currículos foram gerados para cada vaga — visível apenas para administradores
            </p>
          </div>
          <div className="p-6">
            {byJobQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : byJob.length === 0 ? (
              <EmptyState
                title="Nenhum currículo gerado"
                description="Quando candidatos gerarem currículos, a distribuição por vaga aparecerá aqui."
              />
            ) : (
              <div className="space-y-3">
                {byJob.slice(0, 10).map((row) => (
                  <div key={row.jobId} className="flex items-center gap-3">
                    <div className="w-1/3 truncate text-sm text-gray-700" title={row.jobTitle}>
                      {row.jobTitle}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#2B5FC2] h-3 rounded-full"
                        style={{ width: `${Math.round((row.resumeCount / maxResumeCount) * 100)}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm font-semibold text-gray-900">{row.resumeCount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
