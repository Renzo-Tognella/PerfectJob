import { useState } from 'react';
import { useResumes } from '@/hooks/useResumes';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function ResumesPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useResumes(page, 20);

  const resumes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Currículos</h1>
        {!isLoading && !isError && (
          <span className="text-sm text-gray-500">{totalElements} no total</span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Erro ao carregar currículos"
              description="Não foi possível obter a lista de currículos."
              action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
            />
          ) : resumes.length === 0 ? (
            <EmptyState
              title="Nenhum currículo gerado"
              description="Quando candidatos gerarem currículos para vagas, eles aparecerão aqui."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidato</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{resume.candidateName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{resume.candidateEmail ?? '-'}</td>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
