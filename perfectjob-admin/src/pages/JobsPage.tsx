import { useState } from 'react';
import { Plus, Pencil, X, Users } from 'lucide-react';
import { useJobs, useCloseJob } from '@/hooks/useJobs';
import type { Job } from '@/services/api/jobApi';
import { JobFormModal } from './JobFormModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';

export function JobsPage() {
  const { data: jobs = [], isLoading, isError, refetch } = useJobs();
  const closeJob = useCloseJob();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [pendingCloseId, setPendingCloseId] = useState<number | null>(null);

  const handleClose = (id: number) => {
    setPendingCloseId(id);
  };

  const confirmClose = () => {
    if (pendingCloseId === null) return;
    closeJob.mutate(pendingCloseId, {
      onSuccess: () => {
        toast.success('Vaga encerrada com sucesso');
        setPendingCloseId(null);
      },
      onError: () => {
        toast.error('Erro ao encerrar vaga. Tente novamente.');
        setPendingCloseId(null);
      },
    });
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Nova Vaga
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Erro ao carregar vagas"
              description="Não foi possível obter a lista de vagas."
              action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
            />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="Nenhuma vaga encontrada"
              description="Crie a primeira vaga para começar."
              action={<Button onClick={handleCreate}><Plus className="w-4 h-4" />Nova Vaga</Button>}
            />
          ) : (
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
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.companyName || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={job.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {job.status === 'ACTIVE' ? 'Ativa' : job.status === 'CLOSED' ? 'Encerrada' : job.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.applicationsCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(job)}
                          className="p-1.5 text-gray-500 hover:text-[#2B5FC2] hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                          aria-label="Editar vaga"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {job.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleClose(job.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Encerrar"
                            aria-label="Encerrar vaga"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 text-gray-500 hover:text-[#2B5FC2] hover:bg-blue-50 rounded transition-colors"
                          title="Ver Candidatos"
                          aria-label="Ver candidatos"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <JobFormModal
          job={editingJob}
          onClose={() => {
            setIsModalOpen(false);
            setEditingJob(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        isOpen={pendingCloseId !== null}
        onClose={() => setPendingCloseId(null)}
        onConfirm={confirmClose}
        title="Encerrar vaga"
        message="Tem certeza que deseja encerrar esta vaga? Esta ação não pode ser desfeita."
        confirmText="Encerrar"
        variant="danger"
        loading={closeJob.isPending}
      />
    </div>
  );
}
